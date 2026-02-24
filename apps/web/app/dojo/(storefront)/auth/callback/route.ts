import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * GET /dojo/auth/callback
 * OAuth callback: exchange code for session (PKCE), then redirect to next param or /dojo.
 * Supabase redirects here after Discord OAuth with ?code=...
 *
 * Pattern from guild-mnky: create redirect response BEFORE exchange so setAll() writes session
 * cookies onto it; then wait 50ms so deferred setAll() in supabase-js runs (see supabase/supabase-js#2037).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next") : "/dojo"
  const origin = url.origin

  if (error) {
    const cookieStore = await cookies()
    const hasCodeVerifier = cookieStore.getAll().some((c) => c.name.includes("code-verifier"))
    if (!hasCodeVerifier) {
      return NextResponse.redirect(`${origin}/auth/login`)
    }
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent("No code in callback")}`
    )
  }

  const cookieStore = await cookies()
  const redirectResponse = NextResponse.redirect(`${origin}${next}`)

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
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const discordId =
    user?.identities?.find((i) => i.provider === "discord")?.identity_data?.id ??
    (user?.app_metadata?.provider === "discord"
      ? (user?.user_metadata as { sub?: string })?.sub
      : undefined)
  if (user?.id && discordId) {
    await supabase
      .from("profiles")
      .update({ discord_user_id: String(discordId) })
      .eq("id", user.id)
  }

  await new Promise((resolve) => setTimeout(resolve, 50))
  return redirectResponse
}
