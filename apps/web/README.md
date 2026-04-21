# NovaPay Web (apps/web)

NovaPay Web is a fintech-grade dashboard UI built with Next.js (App Router). It prioritizes:

- **Clarity**: clean information hierarchy for balances and activity.
- **Safety**: explicit confirmation states, disable-while-pending UX, and clear error surfaces.
- **Speed**: server-side API proxy routes to avoid CORS complexity and keep credentials off the client.

## Tech stack

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui
- Lucide React

## Running locally (from repo root)

```bash
pnpm dev:web
```

The web app runs at `http://localhost:3001`.

## Backend connectivity

The frontend talks to the API through server-side proxy routes (Next Route Handlers). Configure the API base URL:

Create `apps/web/.env.local`:

```bash
NOVAPAY_API_BASE="http://localhost:3000"
```

This keeps browser requests same-origin and avoids CORS issues in development.

## UX notes (financial systems)

- Treat monetary values as **strings** end-to-end and render with consistent formatting.
- Use idempotency keys for write operations where retries are possible.
- Make “pending / succeeded / failed” states visible and stable (no flicker).
