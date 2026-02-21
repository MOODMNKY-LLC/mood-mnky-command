import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

const MAIN_DOMAINS = ["www.moodmnky.com", "moodmnky.com"]
const VERSE_DOMAIN = "mnky-verse.moodmnky.com"

/**
 * Normalize host for comparison (lowercase, strip port, trim).
 * Vercel and proxies can send different casing or trailing characters.
 */
function normalizeHost(host: string): string {
  return (host ?? "").replace(/:\d+$/, "").trim().toLowerCase()
}

/**
 * Compute effective pathname when host-based rewrite applies.
 * Used so session logic sees /main or /verse and allows public access / role checks correctly.
 */
function getEffectivePathname(host: string, pathname: string): string {
  const normalizedHost = normalizeHost(host)

  if (VERSE_DOMAIN === normalizedHost && !pathname.startsWith("/verse")) {
    return pathname === "/" ? "/verse" : `/verse${pathname}`
  }
  if (MAIN_DOMAINS.some((d) => d === normalizedHost) && !pathname.startsWith("/main")) {
    return pathname === "/" ? "/main" : `/main${pathname}`
  }
  return pathname
}

/**
 * Returns true if the request should be rewritten (host maps to a different path prefix).
 */
function shouldRewrite(host: string, pathname: string): boolean {
  const effective = getEffectivePathname(host, pathname)
  return effective !== pathname
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const pathname = request.nextUrl.pathname
  const effectivePathname = getEffectivePathname(host, pathname)
  const sessionResponse = await updateSession(request, {
    effectivePathname,
  })

  if (!shouldRewrite(host, pathname)) {
    return sessionResponse
  }

  const rewritePath =
    effectivePathname + (request.nextUrl.search ?? "")
  const rewriteUrl = new URL(rewritePath, request.url)
  const rewriteResponse = NextResponse.rewrite(rewriteUrl)

  sessionResponse.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie
    rewriteResponse.cookies.set(name, value, options)
  })

  return rewriteResponse
}

export const config = {
  matcher: [
    // Explicitly include root so host-based rewrite runs for www.moodmnky.com/ and mnky-verse.moodmnky.com/
    "/",
    // Exclude static assets and PWA; exclude OAuth routes so session middleware doesn't interfere (guild-mnky pattern).
    // OAuth init: /auth/github, /verse/auth/discord set PKCE cookie and redirect.
    // OAuth callback: /auth/callback, /verse/auth/callback run exchangeCodeForSession and set session cookies.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|auth/callback|verse/auth/callback|auth/github|verse/auth/discord|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
