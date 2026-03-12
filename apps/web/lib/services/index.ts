import type { DeployedServiceId, ServiceStatusResult } from "./types"
import { getJellyfinStatus, isJellyfinConfigured } from "./jellyfin"
import { getN8nStatus, isN8nConfigured } from "./n8n"
import { getFlowiseServiceStatus, isFlowiseServiceConfigured } from "./flowise"
import { getTrueNasStatus, isTrueNasConfigured } from "./truenas"
import { getNextcloudStatus, isNextcloudConfigured } from "./nextcloud"
import { getPalworldStatus, isPalworldConfigured } from "./palworld"
import { getDeployedServiceConfig } from "./deployed-services-config"
import { MAIN_SERVICES } from "@/lib/main-services-data"

export type { ServiceStatusResult, DeployedServiceId }
export { DEPLOYED_SERVICE_IDS } from "./types"

/** Build env-based config for a service (same keys as DB mapping). */
function getEnvConfigForService(slug: DeployedServiceId): unknown {
  switch (slug) {
    case "mnky-cloud": {
      const baseUrl = process.env.NEXTCLOUD_URL?.replace(/\/$/, "")
      const clientId = process.env.NEXTCLOUD_OAUTH_CLIENT_ID
      const clientSecret = process.env.NEXTCLOUD_OAUTH_CLIENT_SECRET
      const appPasswordSet =
        process.env.NEXTCLOUD_ADMIN_USER && process.env.NEXTCLOUD_APP_PASSWORD
      return baseUrl && (clientId && clientSecret || appPasswordSet)
        ? { baseUrl, clientId: clientId ?? "", clientSecret: clientSecret ?? "" }
        : null
    }
    case "mnky-media": {
      const baseUrl = process.env.JELLYFIN_BASE_URL?.replace(/\/$/, "")
      const apiKey = process.env.JELLYFIN_API_KEY
      return baseUrl && apiKey ? { baseUrl, apiKey } : null
    }
    case "mnky-drive": {
      const baseUrl = process.env.TRUENAS_BASE_URL?.replace(/\/$/, "")
      const apiKey = process.env.TRUENAS_API_KEY
      return baseUrl && apiKey ? { baseUrl, apiKey } : null
    }
    case "mnky-auto": {
      const baseUrl = process.env.N8N_API_URL?.replace(/\/$/, "")
      const apiKey = process.env.N8N_API_KEY
      return baseUrl && apiKey ? { baseUrl, apiKey } : null
    }
    case "mnky-agents": {
      const baseUrl = process.env.FLOWISE_BASE_URL?.replace(/\/$/, "")
      const apiKey = process.env.FLOWISE_API_KEY
      return baseUrl && apiKey ? { baseUrl, apiKey } : null
    }
    case "mnky-games": {
      const baseUrl = process.env.PALWORLD_SERVER_URL?.replace(/\/$/, "")
      const apiUser = process.env.PALWORLD_API_USER || "admin"
      const apiPassword = process.env.PALWORLD_API_PASSWORD
      const steamSet = Boolean(process.env.STEAM_WEB_API_KEY)
      const palworldSet = baseUrl && apiPassword
      return palworldSet
        ? { baseUrl, apiUser, apiPassword }
        : steamSet
          ? { baseUrl: "", apiUser, apiPassword: "" }
          : null
    }
    case "mood-mnky-experience":
      return null
    default:
      return null
  }
}

/** Map DB row + credentials to module config shape. Returns null if required fields missing. */
function dbToModuleConfig(
  slug: DeployedServiceId,
  db: { base_url: string | null; credentials: Record<string, unknown> },
): unknown {
  const base = db.base_url ?? (db.credentials.base_url as string) ?? ""
  const c = db.credentials
  switch (slug) {
    case "mnky-cloud": {
      const clientId = (c.client_id ?? c.clientId) as string | undefined
      const clientSecret = (c.client_secret ?? c.clientSecret) as string | undefined
      return base && clientId && clientSecret
        ? { baseUrl: base, clientId, clientSecret }
        : null
    }
    case "mnky-media": {
      const apiKey = (c.api_key ?? c.apiKey) as string | undefined
      return base && apiKey ? { baseUrl: base, apiKey } : null
    }
    case "mnky-drive": {
      const apiKey = (c.api_key ?? c.apiKey) as string | undefined
      return base && apiKey ? { baseUrl: base, apiKey } : null
    }
    case "mnky-auto": {
      const apiKey = (c.api_key ?? c.apiKey) as string | undefined
      return base && apiKey ? { baseUrl: base, apiKey } : null
    }
    case "mnky-agents": {
      const apiKey = (c.api_key ?? c.apiKey) as string | undefined
      return base && apiKey ? { baseUrl: base, apiKey } : null
    }
    case "mnky-games": {
      const apiPassword = (c.api_password ?? c.apiPassword) as string | undefined
      return base && apiPassword
        ? {
            baseUrl: base,
            apiUser: ((c.api_user ?? c.apiUser) as string) ?? "admin",
            apiPassword,
          }
        : null
    }
    default:
      return null
  }
}

/**
 * Returns config for a service from env or from deployed_services (DB).
 * Prefers env; falls back to DB when env is not set.
 */
export async function getConfigForService(
  slug: string,
): Promise<unknown> {
  const sid = slug as DeployedServiceId
  const fromEnv = getEnvConfigForService(sid)
  if (fromEnv != null) return fromEnv
  const db = await getDeployedServiceConfig(slug)
  if (!db) return null
  return dbToModuleConfig(sid, db)
}

const SERVICE_MODULES: Record<
  DeployedServiceId,
  {
    isConfigured: () => boolean
    getStatus: (config?: unknown) => Promise<ServiceStatusResult>
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

/** Sync: configured when env is set. Use isServiceConfiguredAsync for env + DB. */
export function isServiceConfigured(slug: string): boolean {
  const mod = SERVICE_MODULES[slug as DeployedServiceId]
  return mod ? mod.isConfigured() : false
}

/** Async: configured when env or deployed_services (DB) has valid config. */
export async function isServiceConfiguredAsync(slug: string): Promise<boolean> {
  const config = await getConfigForService(slug)
  return config != null
}

export async function getServiceStatus(slug: string): Promise<{
  configured: boolean
  status?: string
  metrics?: Record<string, number | string>
  error?: string
}> {
  const mod = SERVICE_MODULES[slug as DeployedServiceId]
  if (!mod) return { configured: false }
  const config = await getConfigForService(slug)
  if (config == null) return { configured: false }
  const result = await mod.getStatus(config)
  return {
    configured: true,
    status: result.status,
    metrics: result.metrics,
    error: result.error,
  }
}

/**
 * Returns status for all known deployed services (for MNKY LABZ analytics).
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
