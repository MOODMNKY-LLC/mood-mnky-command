/**
 * Internal API auth: MOODMNKY_API_KEY (Bearer) for server-to-server and Flowise tool façade.
 * Never expose this key to the client.
 */
export function requireInternalApiKey(request: Request): boolean {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  const token = auth.slice(7)
  const key = process.env.MOODMNKY_API_KEY
  if (!key || token !== key) return false
  return true
}
