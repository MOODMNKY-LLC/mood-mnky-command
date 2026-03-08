import { requireAdmin } from '@/lib/auth/require-admin'
import { getChatMessages, deleteChatMessages } from '@/lib/flowise/client'

async function guardAdmin() {
  const auth = await requireAdmin()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  return null
}

export async function GET(req: Request) {
  const guard = await guardAdmin()
  if (guard) return guard
  try {
    const { searchParams } = new URL(req.url)
    const data = await getChatMessages({
      chatflowId: searchParams.get('chatflowId') ?? undefined,
      chatId: searchParams.get('chatId') ?? undefined,
      sessionId: searchParams.get('sessionId') ?? undefined,
      sort: (searchParams.get('sort') as 'ASC' | 'DESC') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
    })
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function DELETE(req: Request) {
  const guard = await guardAdmin()
  if (guard) return guard
  try {
    const { chatflowId, sessionId, memoryType } = await req.json()
    await deleteChatMessages(chatflowId, { sessionId, memoryType })
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
