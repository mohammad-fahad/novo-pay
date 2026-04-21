export function getBackendBaseUrl(): string {
  return process.env.NOVAPAY_API_BASE ?? "http://localhost:3000";
}

export async function proxyJson(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const base = getBackendBaseUrl();
  const url = new URL(path, base);

  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
