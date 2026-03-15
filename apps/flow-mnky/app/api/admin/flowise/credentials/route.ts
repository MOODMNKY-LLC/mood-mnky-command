import { requireAdmin } from '@/lib/auth/require-admin'
import { listCredentials } from '@/lib/flowise/client'

async function guardAdmin() {
  const auth = await requireAdmin()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  return null
}

export async function GET() {
  const err = await guardAdmin()
  if (err) return err
  try {
    const data = await listCredentials()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
