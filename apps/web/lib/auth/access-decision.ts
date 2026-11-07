/**
 * Pure session access decisions for proxy/updateSession.
 * Kept free of Next/Supabase imports for node:test coverage.
 */

export type SessionProfile = {
  role?: string | null
  is_admin?: boolean | null
}

export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; pathname: string }

export const PUBLIC_VERSE_EMBED_PATHS = [
  "/verse/fragrance-wheel",
  "/verse/blending-guide",
  "/verse/glossary",
  "/verse/formulas",
  "/verse/fragrance-oils",
] as const

/** Prefer Dojo paths after /verse → /dojo consolidation. */
export const PUBLIC_DOJO_EMBED_PATHS = [
  "/dojo/fragrance-wheel",
  "/dojo/blending-guide",
  "/dojo/glossary",
  "/dojo/formulas",
  "/dojo/fragrance-oils",
] as const

export function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/auth")
}

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api")
}

export function isMainPath(pathname: string): boolean {
  return pathname.startsWith("/main")
}

export function isVerseAuthPath(pathname: string): boolean {
  return pathname.startsWith("/verse/auth") || pathname.startsWith("/dojo/auth")
}

export function isMemberPath(pathname: string): boolean {
  return pathname.startsWith("/verse") || pathname.startsWith("/dojo")
}

export function isPublicEmbedPath(pathname: string): boolean {
  const paths = [...PUBLIC_VERSE_EMBED_PATHS, ...PUBLIC_DOJO_EMBED_PATHS]
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isAdminProfile(profile: SessionProfile | null | undefined): boolean {
  return profile?.role === "admin" || profile?.is_admin === true
}

export function isPendingProfile(profile: SessionProfile | null | undefined): boolean {
  return profile?.role === "pending"
}

/** Illustrative, read-only review surfaces — never real sessions or grants. */
export function isIllustrativeReviewPath(pathname: string): boolean {
  return pathname === "/review" || pathname.startsWith("/review/")
}

export type MissingConfigAccessDecision =
  | { type: "allow" }
  | { type: "redirect"; pathname: string }
  | { type: "unavailable"; status: 503 }

/**
 * Fail-closed when Supabase anon config is missing.
 * Public Main / auth UI / embeds / illustrative review may render.
 * APIs, Dojo/member, LABZ/platform stay closed — no guest API pass-through.
 * Query flags like ?review=1 never unlock protected routes here.
 */
export function resolveMissingConfigAccess(
  pathname: string,
): MissingConfigAccessDecision {
  // `/` is rewritten to `/main` in proxy; allow as defense-in-depth for share/root entry.
  if (pathname === "/") return { type: "allow" }
  if (isIllustrativeReviewPath(pathname)) return { type: "allow" }
  if (isMainPath(pathname)) return { type: "allow" }
  if (isAuthPath(pathname)) return { type: "allow" }
  if (isPublicEmbedPath(pathname)) return { type: "allow" }
  if (isVerseAuthPath(pathname)) return { type: "allow" }
  if (isApiPath(pathname)) return { type: "unavailable", status: 503 }
  return { type: "redirect", pathname: "/auth/login" }
}

/**
 * Public Main stays browsable for guests, members, pending, and admins.
 * Dojo/member and LABZ stay protected. Creating an identity never grants VIP.
 */
export function resolveSessionAccess(params: {
  pathname: string
  hasUser: boolean
  profile: SessionProfile | null | undefined
}): AccessDecision {
  const { pathname, hasUser, profile } = params

  const authRoute = isAuthPath(pathname)
  const apiRoute = isApiPath(pathname)
  const mainRoute = isMainPath(pathname)
  const verseAuthRoute = isVerseAuthPath(pathname)
  const publicEmbed = isPublicEmbedPath(pathname)
  const memberRoute = isMemberPath(pathname)
  const reviewRoute = isIllustrativeReviewPath(pathname)

  if (!hasUser) {
    if (
      authRoute ||
      apiRoute ||
      verseAuthRoute ||
      publicEmbed ||
      mainRoute ||
      reviewRoute
    ) {
      return { type: "allow" }
    }
    return { type: "redirect", pathname: "/auth/login" }
  }

  if (isPendingProfile(profile)) {
    if (authRoute || apiRoute || mainRoute || reviewRoute) {
      return { type: "allow" }
    }
    return { type: "redirect", pathname: "/auth/pending-approval" }
  }

  if (authRoute || apiRoute || reviewRoute) {
    return { type: "allow" }
  }

  if (!isAdminProfile(profile) && !memberRoute && !mainRoute) {
    return { type: "redirect", pathname: "/dojo" }
  }

  return { type: "allow" }
}
