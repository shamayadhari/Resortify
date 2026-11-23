/** Base URL of the Resortify Express API, e.g. https://api.example.com (no trailing slash). */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").toString().replace(/\/+$/, "");

export const isApiConfigured = API_BASE_URL.length > 0;

export const APP_NAME = "Resortify";

/** Resolve an asset path returned by the API (e.g. "/uploads/a.png") to an absolute URL. */
export function resolveApiAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  if (!isApiConfigured) return undefined;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
