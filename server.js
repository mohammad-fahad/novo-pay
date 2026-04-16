require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");

// Initialize Prisma and Express
const prisma = new PrismaClient();
const app = express();

// Access Prisma's Decimal type for precise financial math
const Decimal = require("@prisma/client").Prisma.Decimal;

app.use(express.json());

/**
 * HEALTH CHECK
 */
app.get("/health", (req, res) => {
    res.json({ status: "live", timestamp: new Date().toISOString() });
});

/**
 * CORE BUSINESS LOGIC: Money Movement
 * Handles atomicity, locking, and currency conversion.
 */
async function runTransferLogic(fromAccountId, toAccountId, amount, idempotencyKey, quoteId) {
    return await prisma.$transaction(async (tx) => {

        // 1. PESSIMISTIC LOCK: Lock the sender's row to prevent race conditions
        const [sender] = await tx.$queryRaw`
            SELECT * FROM "Account" 
            WHERE id = ${fromAccountId} 
            FOR UPDATE
        `;

        if (!sender) throw new Error("SENDER_NOT_FOUND");

        // 2. FX VALIDATION & CONVERSION
        let finalCreditAmount = new Decimal(amount);

        if (quoteId) {
            const quote = await tx.fxQuote.findUnique({ where: { id: quoteId } });

            if (!quote) throw new Error("INVALID_QUOTE");
            if (new Date() > quote.expiresAt) throw new Error("QUOTE_EXPIRED");
            if (quote.usedAt) throw new Error("QUOTE_ALREADY_USED");

            // Calculate converted amount based on the locked rate
            const exchangeRate = new Decimal(quote.rate);
            finalCreditAmount = new Decimal(amount).mul(exchangeRate);

            // Mark quote as consumed within the same transaction
            await tx.fxQuote.update({
                where: { id: quoteId },
                data: { usedAt: new Date() }
            });
        }

        // 3. BALANCE CHECK (Against locked sender row)
        const currentBalance = new Decimal(sender.balance);
        if (currentBalance.lessThan(amount)) {
            throw new Error("INSUFFICIENT_FUNDS");
        }

        // 4. ATOMIC UPDATES: Debit Sender & Credit Receiver
        await tx.account.update({
            where: { id: fromAccountId },
            data: { balance: { decrement: amount } }
        });

        await tx.account.update({
            where: { id: toAccountId },
            data: { balance: { increment: finalCreditAmount } }
        });

        // 5. TRANSACTION RECORD: High-level audit log
        const transaction = await tx.transaction.create({
            data: {
                amount,
                currency: "USD",
                status: "COMPLETED",
                idempotencyKey
            }
        });

        // 6. LEDGER ENTRIES: Double-entry bookkeeping implementation
        await tx.ledgerEntry.createMany({
            data: [
                {
                    accountId: fromAccountId,
                    transactionId: transaction.id,
                    type: "DEBIT",
                    amount: new Decimal(amount).negated(),
                },
                {
                    accountId: toAccountId,
                    transactionId: transaction.id,
                    type: "CREDIT",
                    amount: finalCreditAmount,
                }
            ]
        });

        return transaction;
    });
}

/**
 * ENDPOINT: POST /transfer
 * Initiates the transfer process with idempotency and FX support.
 */
app.post("/transfer", async (req, res) => {
    const { fromAccountId, toAccountId, amount, idempotencyKey, quoteId } = req.body;

    // Validation
    if (!idempotencyKey || !fromAccountId || !toAccountId || amount <= 0) {
        return res.status(400).json({ error: "Missing required fields or invalid amount" });
    }

    try {
        // 1. IDEMPOTENCY CHECK: Ensure the request hasn't been processed
        const existing = await prisma.idempotencyRecord.findUnique({
            where: { key: idempotencyKey }
        });

        if (existing) {
            if (existing.status === "COMPLETED") return res.json(existing.responseBody);
            return res.status(429).json({ error: "Request is already being processed" });
        }

        // 2. INITIATE IDEMPOTENCY: Lock the key to prevent simultaneous retries
        await prisma.idempotencyRecord.create({
            data: {
                key: idempotencyKey,
                requestPayload: req.body,
                status: "PROCESSING",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour validity
            }
        });

        // 3. EXECUTE FINANCIAL LOGIC
        const result = await runTransferLogic(fromAccountId, toAccountId, amount, idempotencyKey, quoteId);

        // 4. COMPLETE IDEMPOTENCY: Save the successful response for future retries
        const response = { success: true, transactionId: result.id };
        await prisma.idempotencyRecord.update({
            where: { key: idempotencyKey },
            data: { status: "COMPLETED", responseBody: response }
        });

        res.json(response);

    } catch (err) {
        console.error("TRANSACTION_FAILURE:", err.message);

        // Map business errors to user-friendly responses
        const businessErrors = ["QUOTE_EXPIRED", "QUOTE_ALREADY_USED", "INVALID_QUOTE", "INSUFFICIENT_FUNDS", "SENDER_NOT_FOUND"];

        if (businessErrors.includes(err.message)) {
            return res.status(400).json({ error: err.message });
        }

        res.status(500).json({ error: "Internal Server Error", detail: err.message });
    }
});

/**
 * ENDPOINT: POST /fx/quote
 * Generates a time-locked FX rate for international transfers.
 */
app.post("/fx/quote", async (req, res) => {
    const { fromCurrency, toCurrency } = req.body;

    if (!fromCurrency || !toCurrency) {
        return res.status(400).json({ error: "Both currencies are required" });
    }

    try {
        const mockRate = 0.85; // Example: 1 USD = 0.85 EUR

        const quote = await prisma.fxQuote.create({
            data: {
                fromCurrency,
                toCurrency,
                rate: mockRate,
                expiresAt: new Date(Date.now() + 60 * 1000), // Valid for 60 seconds
            }
        });

        res.json({
            quoteId: quote.id,
            rate: quote.rate,
            expiresAt: quote.expiresAt
        });
    } catch (err) {
        console.error("FX_QUOTE_ERROR:", err);
        res.status(500).json({ error: "Failed to generate FX quote" });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Senior Backend Engine running at http://localhost:${PORT}`);
});
