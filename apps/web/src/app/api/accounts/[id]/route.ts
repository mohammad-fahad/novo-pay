import { proxyJson } from "../../_lib/backend";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return proxyJson(`/api/accounts/${encodeURIComponent(id)}`, { method: "GET" });
}

