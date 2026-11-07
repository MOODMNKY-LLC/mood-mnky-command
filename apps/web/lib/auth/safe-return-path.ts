const BLOCKED_PREFIXES = ["//", "/\\"] as const

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

export function loginHrefWithReturn(nextPath: string): string {
  const next = safeReturnPath(nextPath, "/main")
  return `/auth/login?next=${encodeURIComponent(next)}`
}

export function signUpHrefWithReturn(nextPath?: string): string {
  if (!nextPath) return "/auth/sign-up"
  const next = safeReturnPath(nextPath, "/main")
  return `/auth/sign-up?next=${encodeURIComponent(next)}`
}
