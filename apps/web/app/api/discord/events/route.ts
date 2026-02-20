import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { inngest } from "@/lib/inngest/client"
import { z } from "zod"

const discordEventSchema = z.object({
  profileId: z.string().uuid(),
  discordUserId: z.string().min(1),
  guildId: z.string().min(1),
  channelId: z.string().optional(),
  eventType: z.enum([
    "joined",
    "message",
    "reaction",
    "voice_minutes",
    "attachment_posted",
    "thread_reply",
  ]),
  eventRef: z.string().optional(),
  value: z.number().int().default(1),
})

export async function POST(request: Request) {
  if (!requireInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = discordEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  await inngest.send({
    name: "discord/event.received",
    data: {
      profileId: parsed.data.profileId,
      discordUserId: parsed.data.discordUserId,
      guildId: parsed.data.guildId,
      channelId: parsed.data.channelId,
      eventType: parsed.data.eventType,
      eventRef: parsed.data.eventRef,
      value: parsed.data.value,
    },
  })

  return NextResponse.json({ ok: true })
}
