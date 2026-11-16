// Tiny browser helpers for our JSON API ({ ok, data } | { ok: false, error }).

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public retryAfter?: number) {
    super(message);
  }
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const response = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const e = payload?.error;
    throw new ApiError(e?.message ?? "Request failed. Please try again.", response.status, e?.code, e?.retryAfter);
  }
  return payload.data as T;
}

export const fetcher = <T,>(url: string) => api<T>(url);

/** Read an NDJSON stream, calling onEvent for each parsed line. */
export async function readNDJSON(response: Response, onEvent: (event: Record<string, unknown>) => void) {
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.error?.message ?? "Request failed.", response.status, payload?.error?.code);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer));
}
