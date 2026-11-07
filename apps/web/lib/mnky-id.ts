/**
 * Config-gated MNKY ID / private VERSE deep-links.
 * Hardcoded URLs alone never enable live enrollment or SSO.
 * No parallel password IdP — Authentik remains intended credential authority.
 */

export type GatedExternalLink =
  | { enabled: true; url: string }
  | { enabled: false; reason: "flag_off" | "url_missing" }

function isTruthyFlag(value: string | undefined): boolean {
  if (!value) return false
  const n = value.trim().toLowerCase()
  return n === "1" || n === "true" || n === "yes" || n === "on"
}

export function getMnkyIdEnrollmentLink(
  env: NodeJS.ProcessEnv = process.env,
): GatedExternalLink {
  if (!isTruthyFlag(env.NEXT_PUBLIC_MNKY_ID_ENROLLMENT_ENABLED)) {
    return { enabled: false, reason: "flag_off" }
  }
  const url = env.NEXT_PUBLIC_MNKY_ID_ENROLLMENT_URL?.trim()
  if (!url) return { enabled: false, reason: "url_missing" }
  return { enabled: true, url }
}

export function getVipPortalLink(
  env: NodeJS.ProcessEnv = process.env,
): GatedExternalLink {
  if (!isTruthyFlag(env.NEXT_PUBLIC_MNKY_ID_VIP_PORTAL_ENABLED)) {
    return { enabled: false, reason: "flag_off" }
  }
  const url = env.NEXT_PUBLIC_MNKY_ID_VIP_PORTAL_URL?.trim()
  if (!url) return { enabled: false, reason: "url_missing" }
  return { enabled: true, url }
}

/** Reference only — never auto-enabled. */
export const MNKY_ID_ENROLLMENT_URL_REFERENCE =
  "https://id.moodmnky.com/if/flow/mnky-id-self-enrollment/"

export const VIP_PORTAL_URL_REFERENCE = "https://vip.moodmnky.com"
