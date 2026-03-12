/**
 * Server-only. Reads deployed_services (by service_id), decrypts credentials,
 * and returns config for use when env vars are not set.
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { decryptCredentials } from "@/lib/credentials-encrypt"

export interface DeployedServiceConfig {
  base_url: string | null
  credentials: Record<string, unknown>
}

/**
 * Returns config for a deployed service from DB (enabled row by service_id).
 * Returns null if no row, disabled, or decryption fails.
 */
export async function getDeployedServiceConfig(
  serviceId: string,
): Promise<DeployedServiceConfig | null> {
  try {
    const admin = createAdminClient()
    const { data: row, error } = await admin
      .from("deployed_services")
      .select("base_url, encrypted_credentials_json")
      .eq("service_id", serviceId)
      .eq("enabled", true)
      .maybeSingle()
    if (error || !row) return null
    let credentials: Record<string, unknown> = {}
    if (row.encrypted_credentials_json) {
      const dec = decryptCredentials(row.encrypted_credentials_json)
      if (dec) {
        try {
          credentials = JSON.parse(dec) as Record<string, unknown>
        } catch {
          // ignore invalid JSON
        }
      }
    }
    return {
      base_url: row.base_url ?? null,
      credentials,
    }
  } catch {
    return null
  }
}
