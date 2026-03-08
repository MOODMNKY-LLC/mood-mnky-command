/**
 * /api/admin/flowise/chatflows/[id]
 * GET    - get single chatflow
 * PUT    - update chatflow
 * DELETE - delete chatflow
 */
import { requireAdmin } from '@/lib/auth/require-admin'
import { getChatflow, updateChatflow, deleteChatflow } from '@/lib/flowise/client'

async function guardAdmin() {
  const auth = await requireAdmin()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  return null
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin()
  if (guard) return guard
  try {
    const { id } = await params
    const data = await getChatflow(id)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin()
  if (guard) return guard
  try {
    const { id } = await params
    const body = await req.json()
    const data = await updateChatflow(id, body)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardAdmin()
  if (guard) return guard
  try {
    const { id } = await params
    await deleteChatflow(id)
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
