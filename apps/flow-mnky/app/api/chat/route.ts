import { requireUser } from '@/lib/auth/require-user'

export const maxDuration = 60

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  return Response.json(
    {
      error: 'This endpoint has been retired. Use /api/chat/run for Flowise inference.',
      activeEndpoint: '/api/chat/run',
    },
    { status: 410 }
  )
}
