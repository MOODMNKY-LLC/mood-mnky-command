import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

const CANONICAL_HOST = "www.moodmnky.com"
const COMMAND_DOMAIN = "mnky-command.moodmnky.com"
const VERSE_DOMAIN = "mnky-verse.moodmnky.com"
const APEX_DOMAIN = "moodmnky.com"

/**
 * Normalize host for comparison (lowercase, strip port, trim).
 */
function normalizeHost(host: string): string {
  return (host ?? "").replace(/:\d+$/, "").trim().toLowerCase()
}

const LEGACY_DOMAINS = [COMMAND_DOMAIN, VERSE_DOMAIN, APEX_DOMAIN] as const

/**
 * Single-domain consolidation: redirect legacy production hosts to www.moodmnky.com
 * with path mapping. Localhost and Vercel preview hosts are not redirected.
 */
function getRedirectUrl(host: string, pathname: string, search: string): string | null {
  const normalized = normalizeHost(host)
  if (normalized === CANONICAL_HOST) return null
  if (!LEGACY_DOMAINS.includes(normalized as (typeof LEGACY_DOMAINS)[number])) return null

  const base = `https://${CANONICAL_HOST}`
  let path = pathname || "/"

  if (normalized === COMMAND_DOMAIN) {
    path = path === "/" ? "/platform" : path
  } else if (normalized === VERSE_DOMAIN) {
    path = path === "/" ? "/dojo" : path
  } else {
    path = path || "/"
  }

  return `${base}${path}${search || ""}`
}

/**
 * On canonical host, root path is rewritten to /main so the marketing site is served at /.
 */
function getRewrittenPath(host: string, pathname: string): string | null {
  if (normalizeHost(host) !== CANONICAL_HOST) return null
  if (pathname !== "/") return null
  return "/main"
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search ?? ""

  const redirectTo = getRedirectUrl(host, pathname, search)
  if (redirectTo) {
    return NextResponse.redirect(redirectTo, 301)
  }

  const rewrittenPath = getRewrittenPath(host, pathname)
  const effectivePathname = rewrittenPath ?? pathname

  const sessionResponse = await updateSession(request, {
    effectivePathname,
  })

  if (!rewrittenPath) {
    return sessionResponse
  }

  const rewriteUrl = new URL(rewrittenPath + search, request.url)
  const rewriteResponse = NextResponse.rewrite(rewriteUrl)
  sessionResponse.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie
    rewriteResponse.cookies.set(name, value, options)
  })
  return rewriteResponse
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|auth/callback|verse/auth/callback|auth/github|verse/auth/discord|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
