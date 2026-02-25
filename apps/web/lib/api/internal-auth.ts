/**
 * Internal API auth: MOODMNKY_API_KEY (Bearer) for server-to-server and Flowise tool façade.
 * Never expose this key to the client.
 * Debug: on 401 we log a safe reason (no-key vs mismatch) for troubleshooting; remove or disable after debugging.
 */
export function requireInternalApiKey(request: Request): boolean {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  const token = auth.slice(7)
  const key = process.env.MOODMNKY_API_KEY
  if (!key) {
    console.warn("[internal-auth] 401: no-key (MOODMNKY_API_KEY not set on server)")
    return false
  }
  if (token !== key) {
    console.warn("[internal-auth] 401: mismatch (Bearer token does not match MOODMNKY_API_KEY)")
    return false
  }
  return true
}
