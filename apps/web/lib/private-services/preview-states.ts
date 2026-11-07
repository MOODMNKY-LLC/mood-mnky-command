/**
 * Illustrative private-service states for member-home preview.
 * NOT live entitlements. Never imply real approval/provisioning.
 */

export type PrivateServicePreviewStatus =
  | "request"
  | "pending"
  | "approved"
  | "provisioning"
  | "active"
  | "revoked"
  | "error"
  | "unavailable"

export type PrivateServicePreviewItem = {
  id: string
  name: string
  status: PrivateServicePreviewStatus
  summary: string
}

/** Demo catalog for unified-experience preview only. */
export const ILLUSTRATIVE_PRIVATE_SERVICE_STATES: PrivateServicePreviewItem[] = [
  {
    id: "preview-media",
    name: "Media clubhouse",
    status: "request",
    summary: "Illustrative — request access (not submitted).",
  },
  {
    id: "preview-mesh",
    name: "Mesh access",
    status: "pending",
    summary: "Illustrative — awaiting separate approval.",
  },
  {
    id: "preview-jellyfin",
    name: "Stream library",
    status: "approved",
    summary: "Illustrative — approved, not provisioned in this preview.",
  },
  {
    id: "preview-device",
    name: "Device connect",
    status: "provisioning",
    summary: "Illustrative — provisioning pipeline demo only.",
  },
  {
    id: "preview-active",
    name: "Active service sample",
    status: "active",
    summary: "Illustrative — active entitlement demo only.",
  },
  {
    id: "preview-revoked",
    name: "Revoked sample",
    status: "revoked",
    summary: "Illustrative — revoked entitlement demo only.",
  },
  {
    id: "preview-error",
    name: "Error sample",
    status: "error",
    summary: "Illustrative — provisioning error state demo only.",
  },
  {
    id: "preview-vip-lounge",
    name: "VIP lounge",
    status: "unavailable",
    summary: "Illustrative — MNKY ID / VIP portal not linked in this environment.",
  },
]

export function isIllustrativePreviewEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  // Default ON for preview branch demos; can disable with NEXT_PUBLIC_PRIVATE_SERVICES_PREVIEW=0
  const flag = env.NEXT_PUBLIC_PRIVATE_SERVICES_PREVIEW
  if (flag === undefined || flag === "") return true
  const n = flag.trim().toLowerCase()
  return !(n === "0" || n === "false" || n === "off" || n === "no")
}
