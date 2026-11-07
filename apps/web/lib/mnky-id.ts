/**
 * MNKY ID entry configuration for the public Main brand site.
 *
 * Enrollment and VIP portal deep-links are config-gated. A hardcoded URL alone
 * does NOT mean public enrollment is live — both an enable flag and a URL
 * must be set. Existing Supabase/social/password logins stay separate.
 */

export type MnkyIdEnrollmentState =
  | { enabled: true; url: string }
  | { enabled: false; reason: "flag_off" | "url_missing" }

export type MnkyIdVipPortalState =
  | { enabled: true; url: string }
  | { enabled: false; reason: "flag_off" | "url_missing" }

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function isTruthyFlag(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on"
}

/**
 * Public self-enrollment into Authentik MNKY ID.
 * Defaults OFF until separately approved and configured.
 */
export function getMnkyIdEnrollmentState(
  env: NodeJS.ProcessEnv = process.env,
): MnkyIdEnrollmentState {
  const flag = env.NEXT_PUBLIC_MNKY_ID_ENROLLMENT_ENABLED
  const url = env.NEXT_PUBLIC_MNKY_ID_ENROLLMENT_URL?.trim()
  if (!isTruthyFlag(flag)) {
    return { enabled: false, reason: "flag_off" }
  }
  if (!url) {
    return { enabled: false, reason: "url_missing" }
  }
  return { enabled: true, url }
}

/**
 * VIP portal sign-in / entry URL (mnky-verse). Defaults OFF until configured.
 * Does not grant VIP services — only links to the private portal when enabled.
 */
export function getMnkyIdVipPortalState(
  env: NodeJS.ProcessEnv = process.env,
): MnkyIdVipPortalState {
  const flag = env.NEXT_PUBLIC_MNKY_ID_VIP_PORTAL_ENABLED
  const url = env.NEXT_PUBLIC_MNKY_ID_VIP_PORTAL_URL?.trim()
  if (!isTruthyFlag(flag)) {
    return { enabled: false, reason: "flag_off" }
  }
  if (!url) {
    return { enabled: false, reason: "url_missing" }
  }
  return { enabled: true, url }
}

/** Convenience: whether any live MNKY ID enrollment CTA should render. */
export function isMnkyIdEnrollmentLive(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getMnkyIdEnrollmentState(env).enabled
}

/** Documented default Authentik enrollment path — reference only, not auto-enabled. */
export const MNKY_ID_ENROLLMENT_URL_REFERENCE =
  "https://id.moodmnky.com/if/flow/mnky-id-self-enrollment/"

/** Documented VIP portal host — reference only, not auto-enabled. */
export const MNKY_ID_VIP_PORTAL_URL_REFERENCE = "https://vip.moodmnky.com"

export function getMnkyIdPublicCopy() {
  const enrollment = getMnkyIdEnrollmentState()
  const vip = getMnkyIdVipPortalState()
  return {
    enrollment,
    vip,
    enrollmentLive: enrollment.enabled,
    vipPortalLive: vip.enabled,
    /** Always-available local Main routes for education (no live IdP required). */
    introPath: "/main/mnky-id",
    createIntroPath: "/main/mnky-id/create",
    signInIntroPath: "/main/mnky-id/sign-in",
  }
}

/** Re-export env reader for tests that need flag parsing isolation. */
export const __mnkyIdTestUtils = {
  isTruthyFlag,
  readEnv,
}
