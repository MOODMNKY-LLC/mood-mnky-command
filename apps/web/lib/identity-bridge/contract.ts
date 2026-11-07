/**
 * Draft identity-bridge contract (NOT activated).
 * Separately approved before any live Authentik↔command linking.
 *
 * Rules:
 * - Link by issuer + subject (never email-only)
 * - Preserve local command UUID
 * - Dual-account proof required
 * - Audit + rollback hooks required
 * - No shared cookie domain, no service-role keys in the web browser
 * - Privileges stay local to each trust zone
 * - Open ID ≠ VIP approval; signup/login never grants services
 */

export type IdentityBridgeLinkDraft = {
  commandUserId: string
  oidcIssuer: string
  oidcSubject: string
  linkedAt?: string
  proofKind: "interactive_consent" | "admin_assisted"
  status: "draft" | "pending_approval" | "active" | "revoked"
}

export const IDENTITY_BRIDGE_ACTIVATION = {
  enabled: false as const,
  reason:
    "Live identity bridge requires separate Simeon approval; preview ships contracts/tests only.",
}

export function assertBridgeNotLive(): void {
  if (IDENTITY_BRIDGE_ACTIVATION.enabled) {
    throw new Error("Identity bridge must not be live without explicit approval")
  }
}

/** Validates shape only — does not persist or call IdPs. */
export function validateBridgeLinkDraft(
  draft: IdentityBridgeLinkDraft,
): { ok: true } | { ok: false; error: string } {
  if (!draft.commandUserId || !draft.oidcIssuer || !draft.oidcSubject) {
    return { ok: false, error: "issuer, subject, and local UUID are required" }
  }
  if (draft.oidcSubject.includes("@")) {
    return { ok: false, error: "subject must not be an email address" }
  }
  return { ok: true }
}
