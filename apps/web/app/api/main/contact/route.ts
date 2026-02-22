import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  message: z.string().min(1, "Message is required").max(10000),
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
      { error: "Contact form is not configured" },
      { status: 503 }
    )
  }

  const ip = getClientIp(request.headers)
  const rateLimit = await checkRateLimit(`main:contact:${ip}`)
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

  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const msg =
      first.name?.[0] ?? first.email?.[0] ?? first.message?.[0] ?? "Validation failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("main_contact_submissions").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    metadata: null,
  })

  if (error) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
