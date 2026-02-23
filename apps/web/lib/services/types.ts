/**
 * Normalized result for deployed service status / metrics.
 * Used by public status API and LABZ analytics.
 */
export interface ServiceStatusResult {
  status?: string
  metrics?: Record<string, number | string>
  error?: string
}

export const DEPLOYED_SERVICE_IDS = [
  "mnky-cloud",
  "mnky-media",
  "mnky-drive",
  "mnky-auto",
  "mnky-agents",
  "mnky-games",
  "mood-mnky-experience",
] as const

export type DeployedServiceId = (typeof DEPLOYED_SERVICE_IDS)[number]
