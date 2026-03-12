/**
 * /api/admin/flowise/chatflows
 * GET  - list all chatflows
 * POST - create a chatflow
 */
import { requireAdmin } from '@/lib/auth/require-admin'
import { listChatflows, createChatflow } from '@/lib/flowise/client'

async function guardAdmin() {
  const auth = await requireAdmin()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  return null
}

export async function GET() {
  const err = await guardAdmin()
  if (err) return err
  try {
    const data = await listChatflows()
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function POST(req: Request) {
  const guard = await guardAdmin()
  if (guard) return guard
  try {
    const body = await req.json()
    const data = await createChatflow(body)
    return Response.json(data, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
