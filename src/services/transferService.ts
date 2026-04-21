import Decimal from "decimal.js";
import { Prisma, type Transaction } from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { toMoney, toPrismaDecimal, type Money } from "../utils/decimal.js";

interface SenderRow {
  id: string;
  balance: Prisma.Decimal;
}

export async function runTransferLogic(
  fromAccountId: string,
  toAccountId: string,
  amount: Money,
  idempotencyKey: string,
  quoteId?: string,
): Promise<Transaction> {
  return prisma.$transaction(async (tx) => {
    const [sender] = await tx.$queryRaw<SenderRow[]>`
      SELECT id, balance FROM "Account"
      WHERE id = ${fromAccountId}
      FOR UPDATE
    `;

    if (!sender) {
      throw new AppError("SENDER_NOT_FOUND", 400);
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
      where: { id: toAccountId },
      data: { balance: { increment: toPrismaDecimal(finalCreditAmount) } },
    });

    const transaction = await tx.transaction.create({
      data: {
        amount: toPrismaDecimal(amount),
        currency: "USD",
        status: "COMPLETED",
        idempotencyKey,
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          accountId: fromAccountId,
          transactionId: transaction.id,
          type: "DEBIT",
          amount: toPrismaDecimal(amount.negated()),
        },
        {
          accountId: toAccountId,
          transactionId: transaction.id,
          type: "CREDIT",
          amount: toPrismaDecimal(finalCreditAmount),
        },
      ],
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
