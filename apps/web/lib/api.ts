// apps/web/lib/api.ts
// Typed API helper. If NEXT_PUBLIC_API_URL is missing, default to /api,
// which Next proxies to the Go API (see next.config.mjs rewrites).
export async function api<T>(
  url: string,
  options?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, headers, ...rest } = options || {};
  const base =
    process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL
      : '/api';

  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    credentials: 'include',
  };

  if (json !== undefined) {
    init.method = init.method ?? 'POST';
    init.body = JSON.stringify(json);
  }

  const res = await fetch(`${base}${url}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return (ct.includes('application/json') ? await res.json() : (undefined as T));
}
