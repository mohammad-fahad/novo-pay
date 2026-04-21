import { proxyJson } from "../_lib/backend";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const accountId = url.searchParams.get("accountId");

  const path = accountId
    ? `/api/transactions?accountId=${encodeURIComponent(accountId)}`
    : "/api/transactions";

  return proxyJson(path, { method: "GET" });
}

