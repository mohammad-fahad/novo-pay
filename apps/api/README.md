# NovaPay API (apps/api)

High-integrity payments backend for NovaPay. The API is designed for **correctness under retries**, **concurrency safety**, and **auditability**.

## Core architecture

NovaPay splits synchronous request handling from asynchronous batch processing:

- **HTTP API (Express)** handles validation and enqueueing work.
- **Distributed task queue (BullMQ + Redis)** buffers bulk workloads and provides retry/backoff.
- **Worker** consumes jobs **sequentially** (`concurrency: 1`) to reduce contention and maintain predictable behavior under load.
- **PostgreSQL (Prisma)** persists accounts, transactions, idempotency records, and ledger entries.

### Distributed task queues (BullMQ + Redis)

- **Queue name**: `payroll-queue`
- **Job type**: `bulk-payroll`
- **Retry policy** (queue-level): `attempts: 3` with fixed backoff
- **Worker**: `src/workers/payrollWorker.ts` is bootstrapped from `src/server.ts` so it is active when the API runs.

This pattern keeps the API responsive even for large payroll batches, while maintaining strong consistency guarantees in the database layer.

## Integrity model

### Double-entry bookkeeping (ledger)

Every money movement is represented as:

- **A `Transaction` record** (high-level business event)
- **Two `LedgerEntry` records**:
  - a **DEBIT** entry against the sender account
  - a **CREDIT** entry against the receiver account

This provides an auditable trail and enables reconciliation.

### Atomicity (single transaction boundary)

All critical writes for a transfer are executed inside a single database transaction:

- sender balance decrement
- receiver balance increment
- transaction creation
- ledger entries creation

If any step fails, **the entire transfer is rolled back**.

### Pessimistic locking (`FOR UPDATE`)

To prevent race conditions (double-spends) under concurrent requests, NovaPay locks account rows:

- Reads balances using `SELECT ... FOR UPDATE`
- Locks both accounts in a deterministic order to avoid deadlocks

This ensures the sender balance check and subsequent debit are **serializable for the locked rows**.

### Idempotency (exactly-once behavior under retries)

Write endpoints are guarded by a client-provided `idempotencyKey`.

Flow:

1. Check `IdempotencyRecord` by key
2. If completed, return cached response
3. If processing, reject with a retry-safe status
4. Otherwise create a processing record and proceed
5. On success, store the response and mark completed

This prevents duplicate transfers when clients retry due to timeouts or network failures.

## Precision: Decimal everywhere

NovaPay avoids floating-point arithmetic for money:

- Input amounts are treated as `string | number` but immediately converted to `Decimal`
- Prisma writes use Prisma `Decimal` columns with precision (`Decimal(20,8)` or `Decimal(20,6)`)

## Bulk payroll (asynchronous batch processing)

### How it works

1. Client calls `POST /api/payroll/disburse` with a list of transfers.
2. API validates the payload and enqueues a BullMQ job with `{ transfers: [...] }`.
3. Worker consumes the job and runs `runTransferLogic()` for each transfer.
4. Worker processes items **one-by-one** and logs per-transfer errors.

### Error resilience

If one recipient transfer fails:

- the worker **logs the failure**
- continues processing subsequent recipients
- returns a final job result: `{ success: true, processed, failed }`

This avoids “all-or-nothing” batch behavior while still preserving atomicity per transfer.

## API endpoints

Base URL (dev): `http://localhost:3000`

- `GET /health`
- `POST /api/transfer` (requires `idempotencyKey`)
- `POST /api/fx/quote`
- `POST /api/payroll/disburse`

### Payroll disbursement request body

```json
{
  "transfers": [
    {
      "fromAccountId": "sender-uuid",
      "toAccountId": "receiver-uuid",
      "amount": "250.00",
      "idempotencyKey": "batch-1-transfer-1",
      "quoteId": "optional-fx-quote-uuid"
    }
  ]
}
```

## Development

### Install (from repo root)

```bash
pnpm install
```

### Environment

Copy the example and fill credentials:

```bash
cp apps/api/.env.example apps/api/.env
```

### Prisma

```bash
pnpm --filter @novapay/api prisma:generate
pnpm --filter @novapay/api prisma:push
```

### Run API (dev)

```bash
pnpm dev:api
```

## High-value test scenarios

- Duplicate retries with the same `idempotencyKey` return the cached response
- Concurrent debits against the same source account do not overspend (row locks)
- Expired/used FX quote rejected
- Bulk payroll where one transfer fails still completes the batch and continues processing
