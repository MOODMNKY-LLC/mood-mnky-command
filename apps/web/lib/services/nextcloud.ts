import type { ServiceStatusResult } from "./types"

export interface NextcloudConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
}

export interface NextcloudAppPasswordConfig {
  baseUrl: string
  username: string
  appPassword: string
}

function getEnvConfig(): NextcloudConfig | null {
  const baseUrl = process.env.NEXTCLOUD_URL?.replace(/\/$/, "")
  const clientId = process.env.NEXTCLOUD_OAUTH_CLIENT_ID
  const clientSecret = process.env.NEXTCLOUD_OAUTH_CLIENT_SECRET
  return baseUrl && clientId && clientSecret ? { baseUrl, clientId, clientSecret } : null
}

function getAppPasswordConfig(): NextcloudAppPasswordConfig | null {
  const baseUrl = process.env.NEXTCLOUD_URL?.replace(/\/$/, "")
  const username = process.env.NEXTCLOUD_ADMIN_USER
  const appPassword = process.env.NEXTCLOUD_APP_PASSWORD
  return baseUrl && username && appPassword ? { baseUrl, username, appPassword } : null
}

/** Configured when either OAuth2 (client id/secret) or App Password (admin user + app password) is set. */
export function isNextcloudConfigured(): boolean {
  return getEnvConfig() != null || getAppPasswordConfig() != null
}

async function getNextcloudStatusViaAppPassword(
  appConfig: NextcloudAppPasswordConfig,
): Promise<ServiceStatusResult> {
  const base = appConfig.baseUrl.replace(/\/$/, "")
  const auth = Buffer.from(`${appConfig.username}:${appConfig.appPassword}`).toString("base64")
  const capRes = await fetch(`${base}/ocs/v2.php/cloud/capabilities?format=json`, {
    headers: {
      Authorization: `Basic ${auth}`,
      "OCS-APIRequest": "true",
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!capRes.ok) {
    return {
      status: "unavailable",
      error: `Capabilities ${capRes.status}`,
      metrics: { auth: "App Password" },
    }
  }
  return { status: "operational", metrics: { product: "Nextcloud", auth: "App Password" } }
}

/**
 * Nextcloud status: tries OAuth2 client_credentials first; on 4xx or missing OAuth2, falls back to
 * App Password (Basic auth) when NEXTCLOUD_ADMIN_USER and NEXTCLOUD_APP_PASSWORD are set.
 */
export async function getNextcloudStatus(
  config?: NextcloudConfig | null,
): Promise<ServiceStatusResult> {
  const oauthConfig = config ?? getEnvConfig()
  const appPasswordConfig = getAppPasswordConfig()

  const tryOAuth2 = oauthConfig?.baseUrl && oauthConfig?.clientId && oauthConfig?.clientSecret

  if (tryOAuth2) {
    try {
      const base = oauthConfig!.baseUrl.replace(/\/$/, "")
      const tokenUrl = `${base}/apps/oauth2/api/v1/token`
      const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: oauthConfig!.clientId,
        client_secret: oauthConfig!.clientSecret,
      })
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: AbortSignal.timeout(8000),
      })
      if (tokenRes.ok) {
        const tokenData = (await tokenRes.json()) as { access_token?: string }
        const token = tokenData.access_token
        if (token) {
          const capRes = await fetch(`${base}/ocs/v2.php/cloud/capabilities?format=json`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "OCS-APIRequest": "true",
            },
            signal: AbortSignal.timeout(5000),
          })
          if (capRes.ok) {
            return { status: "operational", metrics: { product: "Nextcloud" } }
          }
          return {
            status: "operational",
            metrics: { product: "Nextcloud", note: "Token ok, capabilities returned " + capRes.status },
          }
        }
      }
      // OAuth2 failed (400/401/403 or no token) — fall back to App Password if available
      if (appPasswordConfig) {
        return getNextcloudStatusViaAppPassword(appPasswordConfig)
      }
      const text = await tokenRes.text().catch(() => "")
      return {
        status: "unavailable",
        error: `OAuth2 token ${tokenRes.status}. Ensure OAuth2 app uses client_credentials or add App Password (NEXTCLOUD_ADMIN_USER + NEXTCLOUD_APP_PASSWORD).`,
        metrics: { detail: text.slice(0, 80) },
      }
    } catch (err) {
      if (appPasswordConfig) {
        return getNextcloudStatusViaAppPassword(appPasswordConfig)
      }
      return {
        status: "unavailable",
        error: err instanceof Error ? err.message : "Request failed",
      }
    }
  }

  if (appPasswordConfig) {
    try {
      return await getNextcloudStatusViaAppPassword(appPasswordConfig)
    } catch (err) {
      return {
        status: "unavailable",
        error: err instanceof Error ? err.message : "Request failed",
      }
    }
  }

  return { error: "NEXTCLOUD_URL and either OAuth2 credentials or App Password (NEXTCLOUD_ADMIN_USER + NEXTCLOUD_APP_PASSWORD) not set" }
}
