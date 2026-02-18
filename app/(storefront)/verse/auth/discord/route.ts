import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /verse/auth/discord
 * Initiates Discord OAuth for MNKY VERSE. Redirects to Supabase OAuth URL.
 * Only used from VERSE auth tab (Discord login button).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const origin = request.nextUrl.origin
  const callbackUrl = `${origin}/verse/auth/callback?next=/verse`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    )
  }

  if (!data?.url) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent("No OAuth URL returned")}`
    )
  }

  return NextResponse.redirect(data.url)
}
