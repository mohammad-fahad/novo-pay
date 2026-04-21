import { Decimal } from "decimal.js";
import { EntryType, } from "@prisma/client";
import { prisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { toMoney, toPrismaDecimal } from "../utils/decimal.js";
export async function runTransferLogic(fromAccountId, toAccountId, amount, idempotencyKey, quoteId, transactionType = "TRANSFER") {
    console.log("[TRANSFER] START", {
        idempotencyKey,
        fromAccountId,
        toAccountId,
        transactionType,
    });
    return prisma.$transaction(async (tx) => {
        // Lock both accounts in deterministic order to avoid deadlocks.
        const lockedAccounts = await tx.$queryRaw `
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
        };
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
export async function transferWithIdempotency(input) {
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
            return existing.responseBody;
        }
        throw new AppError("Request is already being processed", 429);
    }
    await prisma.idempotencyRecord.create({
        data: {
            key: idempotencyKey,
            requestPayload: input,
            status: "PROCESSING",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });
    const result = await runTransferLogic(fromAccountId, toAccountId, amountDecimal, idempotencyKey, quoteId);
    const response = { success: true, transactionId: result.id };
    await prisma.idempotencyRecord.update({
        where: { key: idempotencyKey },
        data: {
            status: "COMPLETED",
            responseBody: response,
        },
    });
    return response;
}
