import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/** Cookie entry captured during setAll for attaching to a redirect response. */
export type OAuthRedirectCookie = {
  name: string
  value: string
  options?: { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" }
}

/**
 * Use in OAuth init Route Handlers (e.g. /auth/github, /verse/auth/discord).
 * Returns a Supabase client and an array of cookies that Supabase sets during
 * signInWithOAuth (PKCE code_verifier). Attach these cookies to your redirect
 * response so the browser has them when it hits the callback route; otherwise
 * exchangeCodeForSession fails with "OAuth state parameter missing" in local dev.
 */
export async function createClientForOAuthRedirect(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>
  cookiesToSet: OAuthRedirectCookie[]
}> {
  const cookieStore = await cookies()
  const cookiesToSet: OAuthRedirectCookie[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              cookiesToSet.push({ name, value, options })
            })
          } catch {
            // setAll from Server Component — safe to ignore
          }
        },
      },
    },
  )

  return { supabase, cookiesToSet }
}

/**
 * Apply cookies captured during signInWithOAuth onto a redirect response.
 * Call this in OAuth init routes so the PKCE code_verifier is sent to the browser.
 */
export function applyOAuthCookiesToResponse(
  response: NextResponse,
  cookiesToSet: OAuthRedirectCookie[],
): NextResponse {
  cookiesToSet.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  )
  return response
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll called from Server Component -- safe to ignore
            // if middleware is refreshing sessions
          }
        },
      },
    },
  )
}
