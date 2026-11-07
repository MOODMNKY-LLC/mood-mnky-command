/**
 * Sanitize post-login `next` / redirect targets to same-origin relative paths.
 */

const BLOCKED_PREFIXES = ["//", "/\\"] as const

/**
 * Returns a safe relative path starting with `/`, or the fallback.
 * Rejects protocol-relative, absolute URLs, and empty values.
 */
export function safeReturnPath(
  candidate: string | null | undefined,
  fallback = "/",
): string {
  if (!candidate || typeof candidate !== "string") {
    return fallback.startsWith("/") ? fallback : "/"
  }
  const trimmed = candidate.trim()
  if (!trimmed.startsWith("/")) {
    return fallback.startsWith("/") ? fallback : "/"
  }
  if (BLOCKED_PREFIXES.some((p) => trimmed.startsWith(p))) {
    return fallback.startsWith("/") ? fallback : "/"
  }
  if (trimmed.includes("://")) {
    return fallback.startsWith("/") ? fallback : "/"
  }
  return trimmed
}

/** Build `/auth/login?next=…` with a sanitized return path. */
export function loginHrefWithReturn(nextPath: string): string {
  const next = safeReturnPath(nextPath, "/main")
  return `/auth/login?next=${encodeURIComponent(next)}`
}

/** Build `/auth/sign-up` with optional return path via confirm next (informational only). */
export function signUpHrefWithReturn(nextPath?: string): string {
  if (!nextPath) return "/auth/sign-up"
  const next = safeReturnPath(nextPath, "/main")
  return `/auth/sign-up?next=${encodeURIComponent(next)}`
}
