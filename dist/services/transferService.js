"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTransferLogic = runTransferLogic;
exports.transferWithIdempotency = transferWithIdempotency;
const decimal_js_1 = __importDefault(require("decimal.js"));
const database_js_1 = require("../config/database.js");
const errorHandler_js_1 = require("../middlewares/errorHandler.js");
const decimal_js_2 = require("../utils/decimal.js");
async function runTransferLogic(fromAccountId, toAccountId, amount, idempotencyKey, quoteId) {
    return database_js_1.prisma.$transaction(async (tx) => {
        const [sender] = await tx.$queryRaw `
      SELECT id, balance FROM "Account"
      WHERE id = ${fromAccountId}
      FOR UPDATE
    `;
        if (!sender) {
            throw new errorHandler_js_1.AppError("SENDER_NOT_FOUND", 400);
        }
        let finalCreditAmount = amount;
        if (quoteId) {
            const quote = await tx.fxQuote.findUnique({ where: { id: quoteId } });
            if (!quote) {
                throw new errorHandler_js_1.AppError("INVALID_QUOTE", 400);
            }
            if (new Date() > quote.expiresAt) {
                throw new errorHandler_js_1.AppError("QUOTE_EXPIRED", 400);
            }
            if (quote.usedAt) {
                throw new errorHandler_js_1.AppError("QUOTE_ALREADY_USED", 400);
            }
            const exchangeRate = new decimal_js_1.default(quote.rate.toString());
            finalCreditAmount = amount.times(exchangeRate);
            await tx.fxQuote.update({ where: { id: quoteId }, data: { usedAt: new Date() } });
        }
        const currentBalance = new decimal_js_1.default(sender.balance.toString());
        if (currentBalance.lessThan(amount)) {
            throw new errorHandler_js_1.AppError("INSUFFICIENT_FUNDS", 400);
        }
        await tx.account.update({
            where: { id: fromAccountId },
            data: { balance: { decrement: (0, decimal_js_2.toPrismaDecimal)(amount) } },
        });
        await tx.account.update({
            where: { id: toAccountId },
            data: { balance: { increment: (0, decimal_js_2.toPrismaDecimal)(finalCreditAmount) } },
        });
        const transaction = await tx.transaction.create({
            data: {
                amount: (0, decimal_js_2.toPrismaDecimal)(amount),
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
                    amount: (0, decimal_js_2.toPrismaDecimal)(amount.negated()),
                },
                {
                    accountId: toAccountId,
                    transactionId: transaction.id,
                    type: "CREDIT",
                    amount: (0, decimal_js_2.toPrismaDecimal)(finalCreditAmount),
                },
            ],
        });
        return transaction;
    });
}
async function transferWithIdempotency(input) {
    const { fromAccountId, toAccountId, amount, idempotencyKey, quoteId } = input;
    const amountDecimal = (0, decimal_js_2.toMoney)(amount);
    if (!idempotencyKey || !fromAccountId || !toAccountId || !amountDecimal.greaterThan(0)) {
        throw new errorHandler_js_1.AppError("Missing required fields or invalid amount", 400);
    }
    const existing = await database_js_1.prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
    });
    if (existing) {
        if (existing.status === "COMPLETED" && existing.responseBody) {
            return existing.responseBody;
        }
        throw new errorHandler_js_1.AppError("Request is already being processed", 429);
    }
    await database_js_1.prisma.idempotencyRecord.create({
        data: {
            key: idempotencyKey,
            requestPayload: input,
            status: "PROCESSING",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });
    const result = await runTransferLogic(fromAccountId, toAccountId, amountDecimal, idempotencyKey, quoteId);
    const response = { success: true, transactionId: result.id };
    await database_js_1.prisma.idempotencyRecord.update({
        where: { key: idempotencyKey },
        data: {
            status: "COMPLETED",
            responseBody: response,
        },
    });
    return response;
}
