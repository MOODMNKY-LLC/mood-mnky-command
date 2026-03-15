import { requireAdmin } from '@/lib/auth/require-admin'
import { pingN8n } from '@/lib/n8n/client'

async function guardAdmin() {
  const auth = await requireAdmin()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  return null
}

export async function GET() {
  const err = await guardAdmin()
  if (err) return err
  return Response.json(await pingN8n())
}
