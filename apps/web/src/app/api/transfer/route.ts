import { proxyJson } from "../_lib/backend";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  return proxyJson("/api/transfer", {
    method: "POST",
    body,
  });
}
