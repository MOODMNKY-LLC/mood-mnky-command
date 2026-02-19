import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * GET /auth/callback
 * App-level OAuth callback: exchange code for session (PKCE), then redirect to next param or /.
 * Used by LABZ GitHub (and any OAuth that redirects here). Verse Discord uses /verse/auth/callback.
 *
 * Pattern from guild-mnky: create redirect response BEFORE exchange so setAll() writes session
 * cookies onto it; then wait 50ms so deferred setAll() in supabase-js runs (see supabase/supabase-js#2037).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next") : "/"
  const origin = url.origin

  // Stale OAuth error (e.g. from history): no code_verifier cookie → redirect to login (guild-mnky)
  if (error) {
    const cookieStore = await cookies()
    const hasCodeVerifier = cookieStore.getAll().some((c) => c.name.includes("code-verifier"))
    if (!hasCodeVerifier) {
      return NextResponse.redirect(`${origin}/auth/login`)
    }
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const cookieStore = await cookies()
  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocalEnv = process.env.NODE_ENV === "development"
  const redirectBase =
    isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`

  // Create redirect response BEFORE exchange so setAll() can attach cookies to it (guild-mnky)
  const redirectResponse = NextResponse.redirect(`${redirectBase}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            redirectResponse.cookies.set(name, value, options ?? {})
          })
        },
      },
    },
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  // Let deferred setAll() run before returning (supabase-js v2.91+ defers SIGNED_IN; see supabase/supabase-js#2037)
  await new Promise((resolve) => setTimeout(resolve, 50))

  return redirectResponse
}
