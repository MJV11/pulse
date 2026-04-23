const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`

/**
 * Authenticated fetch wrapper for the Supabase Edge Function API.
 * Throws on non-2xx responses with the server's error message when available.
 */
export async function apiFetch<T = unknown>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error((body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`)
  }

  return body as T
}
