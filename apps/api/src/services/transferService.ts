import { Decimal } from "decimal.js";
import {
  EntryType,
  Prisma,
  type Transaction,
} from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/errorHandler";
import { toMoney, toPrismaDecimal, type Money } from "../utils/decimal";

interface SenderRow {
  id: string;
  balance: Prisma.Decimal;
}

type TransactionKind = "TRANSFER" | "PAYROLL";

export async function runTransferLogic(
  fromAccountId: string,
  toAccountId: string,
  amount: Money,
  idempotencyKey: string,
  quoteId?: string,
  transactionType: TransactionKind = "TRANSFER",
): Promise<Transaction> {
  console.log("[TRANSFER] START", {
    idempotencyKey,
    fromAccountId,
    toAccountId,
    transactionType,
  });

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Lock both accounts in deterministic order to avoid deadlocks.
    const lockedAccounts = await tx.$queryRaw<SenderRow[]>`
      SELECT id, balance FROM "Account"
      WHERE id IN (${fromAccountId}, ${toAccountId})
      ORDER BY id ASC
      FOR UPDATE
    `;

    const sender = lockedAccounts.find((account) => account.id === fromAccountId);
    const receiver = lockedAccounts.find((account) => account.id === toAccountId);

    if (!sender) {
      throw new AppError("SENDER_NOT_FOUND", 400);
    }
    if (!receiver) {
      throw new AppError("RECEIVER_NOT_FOUND", 400);
    }

    let finalCreditAmount = amount;

    if (quoteId) {
      const quote = await tx.fxQuote.findUnique({ where: { id: quoteId } });
      if (!quote) {
        throw new AppError("INVALID_QUOTE", 400);
      }
      if (new Date() > quote.expiresAt) {
        throw new AppError("QUOTE_EXPIRED", 400);
      }
      if (quote.usedAt) {
        throw new AppError("QUOTE_ALREADY_USED", 400);
      }

      const exchangeRate = new Decimal(quote.rate.toString());
      finalCreditAmount = amount.times(exchangeRate);
      await tx.fxQuote.update({ where: { id: quoteId }, data: { usedAt: new Date() } });
    }

    const currentBalance = new Decimal(sender.balance.toString());
    if (currentBalance.lessThan(amount)) {
      throw new AppError("INSUFFICIENT_FUNDS", 400);
    }

    await tx.account.update({
      where: { id: fromAccountId },
      data: { balance: { decrement: toPrismaDecimal(amount) } },
    });

    await tx.account.update({
      where: { id: receiver.id },
      data: { balance: { increment: toPrismaDecimal(finalCreditAmount) } },
    });

    const transactionData = {
      amount: toPrismaDecimal(amount),
      currency: "USD",
      type: transactionType,
      status: "COMPLETED",
      idempotencyKey,
    } as unknown as Prisma.TransactionCreateInput;

    const transaction = await tx.transaction.create({
      data: transactionData,
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          accountId: fromAccountId,
          transactionId: transaction.id,
          type: EntryType.DEBIT,
          amount: toPrismaDecimal(amount.negated()),
        },
        {
          accountId: toAccountId,
          transactionId: transaction.id,
          type: EntryType.CREDIT,
          amount: toPrismaDecimal(finalCreditAmount),
        },
      ],
    });

    console.log("[TRANSFER] FINISH", {
      idempotencyKey,
      transactionId: transaction.id,
      transactionType,
    });

    return transaction;
  });
}

export async function transferWithIdempotency(input: {
  fromAccountId: string;
  toAccountId: string;
  amount: string | number;
  idempotencyKey: string;
  quoteId?: string;
}): Promise<{ success: true; transactionId: string }> {
  const { fromAccountId, toAccountId, amount, idempotencyKey, quoteId } = input;
  const amountDecimal = toMoney(amount);

  if (!idempotencyKey || !fromAccountId || !toAccountId || !amountDecimal.greaterThan(0)) {
    throw new AppError("Missing required fields or invalid amount", 400);
  }

  const existing = await prisma.idempotencyRecord.findUnique({
    where: { key: idempotencyKey },
  });

  if (existing) {
    if (existing.status === "COMPLETED" && existing.responseBody) {
      return existing.responseBody as unknown as { success: true; transactionId: string };
    }
    throw new AppError("Request is already being processed", 429);
  }

  await prisma.idempotencyRecord.create({
    data: {
      key: idempotencyKey,
      requestPayload: input as unknown as Prisma.InputJsonValue,
      status: "PROCESSING",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const result = await runTransferLogic(
    fromAccountId,
    toAccountId,
    amountDecimal,
    idempotencyKey,
    quoteId,
  );

  const response = { success: true as const, transactionId: result.id };
  await prisma.idempotencyRecord.update({
    where: { key: idempotencyKey },
    data: {
      status: "COMPLETED",
      responseBody: response as unknown as Prisma.InputJsonValue,
    },
  });

  return response;
}
