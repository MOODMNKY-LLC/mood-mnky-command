import type { DeployedServiceId, ServiceStatusResult } from "./types"
import { getJellyfinStatus, isJellyfinConfigured } from "./jellyfin"
import { getN8nStatus, isN8nConfigured } from "./n8n"
import { getFlowiseServiceStatus, isFlowiseServiceConfigured } from "./flowise"
import { getTrueNasStatus, isTrueNasConfigured } from "./truenas"
import { getNextcloudStatus, isNextcloudConfigured } from "./nextcloud"
import { getPalworldStatus, isPalworldConfigured } from "./palworld"
import { MAIN_SERVICES } from "@/lib/main-services-data"

export type { ServiceStatusResult, DeployedServiceId }
export { DEPLOYED_SERVICE_IDS } from "./types"

const SERVICE_MODULES: Record<
  DeployedServiceId,
  {
    isConfigured: () => boolean
    getStatus: () => Promise<ServiceStatusResult>
  }
> = {
  "mnky-cloud": {
    isConfigured: isNextcloudConfigured,
    getStatus: getNextcloudStatus,
  },
  "mnky-media": {
    isConfigured: isJellyfinConfigured,
    getStatus: getJellyfinStatus,
  },
  "mnky-drive": {
    isConfigured: isTrueNasConfigured,
    getStatus: getTrueNasStatus,
  },
  "mnky-auto": {
    isConfigured: isN8nConfigured,
    getStatus: getN8nStatus,
  },
  "mnky-agents": {
    isConfigured: isFlowiseServiceConfigured,
    getStatus: getFlowiseServiceStatus,
  },
  "mnky-games": {
    isConfigured: isPalworldConfigured,
    getStatus: getPalworldStatus,
  },
  "mood-mnky-experience": {
    isConfigured: () => false,
    getStatus: async () => ({ status: "operational", metrics: { note: "Uses Shopify/verse; no separate API" } }),
  },
}

export function isServiceConfigured(slug: string): boolean {
  const mod = SERVICE_MODULES[slug as DeployedServiceId]
  return mod ? mod.isConfigured() : false
}

export async function getServiceStatus(slug: string): Promise<{
  configured: boolean
  status?: string
  metrics?: Record<string, number | string>
  error?: string
}> {
  const mod = SERVICE_MODULES[slug as DeployedServiceId]
  if (!mod) {
    return { configured: false }
  }
  if (!mod.isConfigured()) {
    return { configured: false }
  }
  const result = await mod.getStatus()
  return {
    configured: true,
    status: result.status,
    metrics: result.metrics,
    error: result.error,
  }
}

/**
 * Returns status for all known deployed services (for LABZ analytics).
 * Uses MAIN_SERVICES order and ids.
 */
export async function getAllServicesAnalytics(): Promise<
  Array<{
    serviceId: string
    name: string
    configured: boolean
    status?: string
    metrics?: Record<string, number | string>
    error?: string
  }>
> {
  const results = await Promise.all(
    MAIN_SERVICES.map(async (s) => {
      const status = await getServiceStatus(s.id)
      return {
        serviceId: s.id,
        name: s.name,
        configured: status.configured,
        status: status.status,
        metrics: status.metrics,
        error: status.error,
      }
    })
  )
  return results
}
