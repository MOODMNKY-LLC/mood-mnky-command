import { requireAdmin } from '@/lib/auth/require-admin'
import { pingFlowise } from '@/lib/flowise/client'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }
  try {
    const result = await pingFlowise()
    return Response.json(result, {
      status: result.status === 'healthy' ? 200 : result.status === 'unauthorized' ? 401 : 502,
    })
  } catch (err) {
    return Response.json({ status: 'unreachable', error: String(err) }, { status: 502 })
  }
}
