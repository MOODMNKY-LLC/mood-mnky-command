/**
 * POST /api/flowise/chat/feedback
 * Submit thumbs up/down (and optional comment) for a Flowise chat reply.
 * Body: { sessionId, messageId?, chatflowId?, rating: 'positive' | 'negative', comment? }
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    sessionId?: string
    messageId?: string
    chatflowId?: string
    rating?: string
    comment?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : ""
  const rating =
    body.rating === "positive" || body.rating === "negative" ? body.rating : null
  if (!sessionId || !rating) {
    return NextResponse.json(
      { error: "sessionId and rating (positive|negative) are required" },
      { status: 400 }
    )
  }

  const messageId =
    typeof body.messageId === "string" ? body.messageId.trim() || null : null
  const chatflowId =
    typeof body.chatflowId === "string" ? body.chatflowId.trim() || null : null
  const comment =
    typeof body.comment === "string" ? body.comment.trim() || null : null

  const { error } = await supabase.from("flowise_chat_feedback").insert({
    profile_id: user.id,
    session_id: sessionId,
    message_id: messageId,
    chatflow_id: chatflowId,
    rating,
    comment,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
