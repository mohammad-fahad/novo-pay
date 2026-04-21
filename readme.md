# NovaPay - High-Integrity Financial Transaction System

NovaPay is a robust, senior-level backend engine designed to handle high-concurrency financial transactions with absolute data integrity. Built as a response to critical failures in legacy systems (duplicate disbursements, unbalanced ledgers, and race conditions), this system implements industry-standard safety patterns used in modern fintech.

## 🛡️ Core Engineering Principles

This system is engineered to solve the most common "nightmare" scenarios in banking:

### 1. Absolute Atomicity (The Ledger Truth)

Leveraging **Double-Entry Bookkeeping**, every transaction creates balanced Debit and Credit entries. Wrapped in **PostgreSQL Transactions**, the system ensures that money is never created or destroyed, even in the event of a service crash.

### 2. Idempotency (Exactly-Once Processing)

Uses a distributed locking mechanism via an `IdempotencyRecord` table. This prevents duplicate charges caused by network retries or simultaneous request bursts.

- **Mechanism:** SHA-256 payload matching and status-based locking.

### 3. Concurrency Control (Pessimistic Locking)

Implements **Row-Level Locking (`FOR UPDATE`)** during balance updates. This eliminates the "Double Spending" problem by forcing concurrent requests to settle sequentially at the database level.

### 4. Temporal Integrity (FX Quote Locking)

Prevents stale exchange rate losses by issuing **Time-Locked Quotes (60s TTL)**. Transfers are rejected if the associated quote has expired or has been previously consumed.

---

## 🏗️ Technical Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **ORM:** Prisma (v6+)
- **Database:** PostgreSQL
- **Precision Math:** Decimal.js (via Prisma) for floating-point error prevention.

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
PORT=3000
```

### 3. Database Sync

```bash
npx prisma generate
npx prisma db push
```

### 4. Database Safety Net (Critical)

Run the following SQL in your database console to enforce a hardware-level safety net:

```sql
ALTER TABLE "Account" ADD CONSTRAINT "balance_not_negative" CHECK (balance >= 0);
```

### 5. Run the Server

```bash
npm start
```

## 📊 API Documentation

### 1. Generate FX Quote

`POST /fx/quote`  
Purpose: Locks an exchange rate for 60 seconds.  
Body:

```json
{ "fromCurrency": "USD", "toCurrency": "EUR" }
```

### 2. Execute Transfer

`POST /transfer`  
Purpose: Executes an idempotent, cross-currency transfer.  
Body:

```json
{
"fromAccountId": "sender-uuid",
"toAccountId": "receiver-uuid",
"amount": 100.00,
"idempotencyKey": "unique-client-generated-uuid",
"quoteId": "optional-fx-quote-uuid"
}
```

## 🧪 Validated Scenarios

- Scenario A (Duplicate Click): Same `idempotencyKey` returns the cached response without re-processing.
- Scenario B (Race Condition): 10 simultaneous requests to the same account settle one-by-one; 0% chance of overdraft.
- Scenario C (Stale FX): If the `quoteId` is over 60 seconds old, the transaction is automatically rolled back.
- Scenario D (Atomic Failure): If the ledger entry fails to write, the sender's balance update is reverted.

## 📈 Future Roadmap

- Asynchronous Payroll: Integration with BullMQ for bulk disbursements.
- Field-Level Encryption: Envelope encryption for PII (Personally Identifiable Information).
- Audit Hash Chain: Cryptographic linking of ledger rows to detect database tampering.


Developed by: 
### Mohammad Fahad 

Building resilient systems for the future of finance.