import { NextRequest, NextResponse } from "next/server"
import {
  createClientForOAuthRedirect,
  applyOAuthCookiesToResponse,
} from "@/lib/supabase/server"

/**
 * GET /auth/github
 * Initiates GitHub OAuth for MNKY LABZ. Redirects to Supabase OAuth URL.
 * Callback: /auth/callback?next=/ (app-level callback).
 * Cookies set by Supabase (PKCE code_verifier) are attached to the redirect so
 * the callback route can exchange the code for a session in local dev.
 */
export async function GET(request: NextRequest) {
  const { supabase, cookiesToSet } = await createClientForOAuthRedirect()
  const origin = request.nextUrl.origin
  const callbackUrl = `${origin}/auth/callback?next=/`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
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

  const response = NextResponse.redirect(data.url)
  return applyOAuthCookiesToResponse(response, cookiesToSet)
}
