interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string } | string;
}

export class WorkspaceRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload: ApiPayload<T> | null = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const detail = payload?.error;
    throw new WorkspaceRequestError(
      (typeof detail === "string" ? detail : detail?.message) || "The request could not be completed. Please try again.",
      response.status,
    );
  }
  return payload.data as T;
}

export async function optionalRequest<T>(url: string): Promise<T | null> {
  try {
    return await request<T>(url);
  } catch (error) {
    if (error instanceof WorkspaceRequestError && error.status === 404) return null;
    throw error;
  }
}

export function jsonRequest(method: "POST" | "PUT" | "PATCH", body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
