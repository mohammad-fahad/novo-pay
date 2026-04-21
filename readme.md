# NovaPay - High-Integrity Financial Backend

NovaPay is a TypeScript-first backend for financial transfers and bulk payroll execution.  
It is designed around data integrity, race-condition safety, and predictable behavior under retries and concurrent load.

## Core Guarantees

- **Financial precision:** uses `Decimal.js` and Prisma `Decimal` for currency operations.
- **Atomic money movement:** debit/credit + ledger writes execute in a single `prisma.$transaction`.
- **Pessimistic locking:** sender balance checks use `SELECT ... FOR UPDATE` to prevent double-spend races.
- **Idempotent writes:** transfer processing is guarded by `idempotencyKey`.
- **Controlled failures:** global error middleware returns sanitized API errors.

## Tech Stack

- Node.js (v20+)
- TypeScript (`strict`)
- Express
- Prisma + PostgreSQL
- BullMQ + Redis

## Project Structure

```text
src/
  app.ts
  server.ts
  config/
    database.ts
    redis.ts
  controllers/
    transferController.ts
    payrollController.ts
  routes/
    index.ts
    transferRoutes.ts
    payrollRoutes.ts
  services/
    transferService.ts
    quoteService.ts
    payrollService.ts
  workers/
    payrollWorker.ts
  middlewares/
    errorHandler.ts
    idempotency.ts
  utils/
    decimal.ts
    response.ts
  types/
    api.ts
```

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
PORT=3000

# Optional (defaults shown)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# REDIS_PASSWORD=your-password
```

### 3) Generate Prisma client and sync schema

```bash
npx prisma generate
npx prisma db push
```

### 4) Add database safety net (recommended)

```sql
ALTER TABLE "Account"
ADD CONSTRAINT "balance_not_negative" CHECK (balance >= 0);
```

## Run

### API server (development)

```bash
npm run dev
```

### API server (production build)

```bash
npm run build
npm start
```

### Payroll worker

```bash
npm run worker:payroll
```

## API Endpoints

### Health

- `GET /health`

### Generate FX quote

- `POST /fx/quote`
- Request body:

```json
{
  "fromCurrency": "USD",
  "toCurrency": "EUR"
}
```

### Execute transfer

- `POST /transfer`
- Requires `idempotencyKey`
- Request body:

```json
{
  "fromAccountId": "sender-uuid",
  "toAccountId": "receiver-uuid",
  "amount": 100.0,
  "idempotencyKey": "unique-client-generated-uuid",
  "quoteId": "optional-fx-quote-uuid"
}
```

### Enqueue bulk payroll

- `POST /payroll/bulk`
- Request body:

```json
{
  "transfers": [
    {
      "fromAccountId": "sender-uuid",
      "toAccountId": "receiver-uuid",
      "amount": 250.0,
      "idempotencyKey": "batch-1-transfer-1",
      "quoteId": "optional-fx-quote-uuid"
    }
  ]
}
```

## High-Value Test Scenarios

- Duplicate transfer retries with same `idempotencyKey`.
- Concurrent debits against the same source account.
- Expired FX quote usage.
- Failure in ledger creation inside transaction boundary.
- Bulk payroll batch retries with one failing transfer.

## Notes

- This service expects PostgreSQL and Redis to be reachable before startup.
- Keep all monetary values in decimal-compatible formats (`string` or `number`) and avoid floating-point business logic.

---

Developed by Mohammad Fahad.  
Building resilient systems for the future of finance.