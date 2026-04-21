export function getBackendBaseUrl(): string {
  return process.env.NOVAPAY_API_BASE ?? "http://localhost:3000";
}

export async function fetchBackendJson<T>(path: string): Promise<T> {
  const url = new URL(path, getBackendBaseUrl());
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

