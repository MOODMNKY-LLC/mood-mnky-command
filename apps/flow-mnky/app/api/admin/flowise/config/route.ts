/**
 * GET /api/admin/flowise/config
 * Returns public-safe Flowise config for the Connection UI (host for display and link).
 * Does not expose API key or full URL.
 */
import { requireAdmin } from '@/lib/auth/require-admin'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }
  const hostUrl =
    process.env.FLOWISE_HOST_URL?.trim() ||
    process.env.FLOWISE_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FLOWISE_HOST?.trim()
  let hostDisplay: string | null = null
  if (hostUrl) {
    try {
      const u = new URL(hostUrl)
      hostDisplay = u.host
    } catch {
      hostDisplay = hostUrl
    }
  }
  return Response.json({ hostDisplay })
}
