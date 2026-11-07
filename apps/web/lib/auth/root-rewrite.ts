/**
 * Brand home rewrite for `/` (www, Vercel preview, localhost).
 * Query string (including `_vercel_share`) is preserved by the proxy rewrite URL.
 */
export function getRewrittenPath(pathname: string): string | null {
  if (pathname !== "/") return null
  return "/main"
}
