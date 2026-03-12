import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"

const WaitlistSchema = z.object({
  email: z.string().email("Invalid email"),
  source: z.string().max(500).optional(),
})

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown"
  return headers.get("x-real-ip") ?? "unknown"
}

export async function POST(request: Request) {
  const missing = getSupabaseConfigMissing()
  if (missing) {
    return NextResponse.json(
      { error: "Waitlist is not configured" },
      { status: 503 }
    )
  }

  const ip = getClientIp(request.headers)
  const rateLimit = await checkRateLimit(`main:waitlist:${ip}`)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const parsed = WaitlistSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.email?.[0] ?? "Validation failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("main_waitlist").insert({
    email: parsed.data.email,
    source: parsed.data.source ?? null,
  })

  if (error) {
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
