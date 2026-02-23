import type { ServiceStatusResult } from "./types"

const BASE_URL = process.env.NEXTCLOUD_URL?.replace(/\/$/, "")
const CLIENT_ID = process.env.NEXTCLOUD_OAUTH_CLIENT_ID
const CLIENT_SECRET = process.env.NEXTCLOUD_OAUTH_CLIENT_SECRET

export function isNextcloudConfigured(): boolean {
  return Boolean(BASE_URL && CLIENT_ID && CLIENT_SECRET)
}

/**
 * Nextcloud status requires OAuth2 token exchange (client credentials or app password).
 * Phase 1: report configured and try a simple capabilities endpoint with Basic auth (app password) or token.
 * Many setups use App API (EX-APP-ID + secret) instead of OAuth2. We only support OAuth2 client credentials here.
 */
export async function getNextcloudStatus(): Promise<ServiceStatusResult> {
  if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
    return { error: "NEXTCLOUD_URL or OAuth2 credentials not set" }
  }
  try {
    const tokenUrl = `${BASE_URL}/apps/oauth2/api/v1/token`
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    })
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(8000),
    })
    if (!tokenRes.ok) {
      const text = await tokenRes.text()
      return {
        status: "unavailable",
        error: `OAuth2 token ${tokenRes.status}. Ensure OAuth2 app uses client_credentials or add AppAPI.`,
        metrics: { detail: text.slice(0, 80) },
      }
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string }
    const token = tokenData.access_token
    if (!token) {
      return { status: "unavailable", error: "No access_token in response" }
    }
    const capRes = await fetch(`${BASE_URL}/ocs/v2.php/cloud/capabilities?format=json`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "OCS-APIRequest": "true",
      },
      signal: AbortSignal.timeout(5000),
    })
    if (!capRes.ok) {
      return { status: "operational", metrics: { note: "Token ok, capabilities endpoint returned " + capRes.status } }
    }
    return { status: "operational", metrics: { product: "Nextcloud" } }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}
