/**
 * Shared XIVAPI client for game data (Item, Action, servers, etc.).
 * Uses XIVAPI_BASE_URL and XIVAPI_API_KEY from env; key improves rate limits.
 * Lodestone character data uses lib/lodestone/xivapi.ts; this module is for
 * generic game-data proxy routes.
 */

const XIVAPI_BASE =
  process.env.XIVAPI_BASE_URL ?? "https://xivapi.com";
const XIVAPI_KEY = process.env.XIVAPI_API_KEY ?? "";

/**
 * Build a full XIVAPI URL with optional query params and API key.
 */
export function buildXivapiUrl(
  path: string,
  params: Record<string, string> = {},
): string {
  const url = new URL(path, XIVAPI_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, v);
  });
  if (XIVAPI_KEY) url.searchParams.set("key", XIVAPI_KEY);
  return url.toString();
}

/**
 * GET a XIVAPI path and return JSON. Throws on non-OK response.
 */
export async function xivapiGet<T = unknown>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = buildXivapiUrl(path, params);
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`XIVAPI ${path}: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}
