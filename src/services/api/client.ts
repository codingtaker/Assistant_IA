/**
 * Base URL for all API requests.
 * Resolved from VITE_API_URL at build time; falls back to "/api" so the
 * Vite dev-server proxy (vite.config.ts → server.proxy) forwards requests
 * to the backend running on port 3001.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

interface FetchOptions extends RequestInit {
  body?: BodyInit | null;
}

/**
 * Core fetch wrapper used by all API calls.
 * - Always sends `Content-Type: application/json`.
 * - On a non-2xx response, extracts `error.message` from the JSON body
 *   (matching the backend error shape) and throws an Error with that message.
 *
 * @template T Expected response body type.
 * @param path  Path relative to BASE_URL (e.g. "/pitch/generate").
 * @param options Standard RequestInit options (method, body, headers…).
 */
async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      body?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

/**
 * Thin typed HTTP client used across the frontend.
 * Extend with `put`, `patch`, `delete` methods as new endpoints are added.
 */
export const apiClient = {
  /** Perform a GET request and return the typed JSON body. */
  get: <T>(path: string) => request<T>(path),
  /** Perform a POST request with a JSON body and return the typed JSON response. */
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
};
