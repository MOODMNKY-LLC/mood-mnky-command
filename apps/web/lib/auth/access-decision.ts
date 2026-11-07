/**
 * Pure session access decisions for the Next.js proxy/updateSession gate.
 * Kept free of Next/Supabase imports so node:test can cover role/path matrix.
 */

export type SessionProfile = {
  role?: string | null
  is_admin?: boolean | null
}

export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; pathname: string }

/** Public fragrance embed paths (legacy /verse allowlist). */
export const PUBLIC_VERSE_EMBED_PATHS = [
  "/verse/fragrance-wheel",
  "/verse/blending-guide",
  "/verse/glossary",
  "/verse/formulas",
  "/verse/fragrance-oils",
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
  return pathname.startsWith("/verse/auth")
}

export function isMemberPath(pathname: string): boolean {
  return pathname.startsWith("/verse") || pathname.startsWith("/dojo")
}

export function isPublicVerseEmbedPath(pathname: string): boolean {
  return PUBLIC_VERSE_EMBED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function isAdminProfile(profile: SessionProfile | null | undefined): boolean {
  return profile?.role === "admin" || profile?.is_admin === true
}

export function isPendingProfile(profile: SessionProfile | null | undefined): boolean {
  return profile?.role === "pending"
}

/**
 * Decide whether a request may proceed given auth state and pathname.
 *
 * Public Main (`/main*`) stays browsable for guests, signed-in members,
 * and pending accounts. Protected Dojo/member and LABZ/admin routes keep
 * existing authz. Creating an identity does not grant VIP/services.
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
  const publicVerseEmbed = isPublicVerseEmbedPath(pathname)
  const memberRoute = isMemberPath(pathname)

  if (!hasUser) {
    if (
      authRoute ||
      apiRoute ||
      verseAuthRoute ||
      publicVerseEmbed ||
      mainRoute
    ) {
      return { type: "allow" }
    }
    return { type: "redirect", pathname: "/auth/login" }
  }

  // Authenticated: pending may use auth + api + public Main only.
  if (isPendingProfile(profile)) {
    if (authRoute || apiRoute || mainRoute) {
      return { type: "allow" }
    }
    return { type: "redirect", pathname: "/auth/pending-approval" }
  }

  if (authRoute || apiRoute) {
    return { type: "allow" }
  }

  // Non-admins stay on member surfaces or public Main — not LABZ/dashboard.
  if (!isAdminProfile(profile) && !memberRoute && !mainRoute) {
    return { type: "redirect", pathname: "/verse" }
  }

  return { type: "allow" }
}
