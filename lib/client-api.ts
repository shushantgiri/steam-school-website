/** Thin fetch wrapper for the admin dashboard. Errors carry the API message. */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data && typeof data === "object" && "error" in data ? String(data.error) : null;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

/**
 * GETs carry a unique query param so no cache between the browser and the
 * server (ISP proxy, antivirus web-shield, CDN) can ever answer with a stale
 * copy — a URL that has never been seen cannot be served from any cache.
 */
const bust = (url: string) => url + (url.includes("?") ? "&" : "?") + "_=" + Date.now();

export const api = {
  get: <T>(url: string) => request<T>(bust(url)),
  post: <T>(url: string, body: unknown) => request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) => request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) => request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
