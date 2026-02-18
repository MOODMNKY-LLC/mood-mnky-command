import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /verse/auth/callback
 * OAuth callback: exchange code for session (PKCE), then redirect to next param or /verse.
 * Supabase redirects here after Discord OAuth with ?code=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next") : "/verse"
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent("No code in callback")}`
    )
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    )
  }

  return NextResponse.redirect(`${origin}${next}`)
}
