/**
 * PKCE and session helpers for Shopify Customer Account API OAuth 2.0.
 * Uses Node crypto for server-side PKCE generation.
 * Config helper trims env vars to avoid CRLF/whitespace causing "invalid client credentials" from Shopify.
 */

import crypto from "node:crypto";

export const CUSTOMER_SESSION_COOKIE = "__customer_session";

export type CustomerAccountApiConfig = {
  storeDomain: string | undefined
  clientId: string | undefined
  appUrl: string | undefined
  /** If set (e.g. from Application endpoints panel), use instead of discovery for authorize. */
  authorizeUrl: string | undefined
  /** If set (e.g. from Application endpoints panel), use instead of discovery for token. */
  tokenUrl: string | undefined
  /** If set (e.g. from Application endpoints panel), use instead of discovery for end_session (logout). */
  logoutUrl: string | undefined
}

/** True when origin is localhost (http or https, any port). Shopify requires a public HTTPS URL; use env app URL (e.g. ngrok) instead. */
export function isLocalhostOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  return /^https?:\/\/localhost(:\d+)?$/i.test(origin)
}

/** Build app URL for localhost: prefer NEXT_PUBLIC_APP_URL, then https://NGROK_DOMAIN, then NEXT_PUBLIC_VERSE_APP_URL. */
function getAppUrlForLocalhost(): string | undefined {
  const fromApp = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromApp) return fromApp
  const ngrokDomain = process.env.NGROK_DOMAIN?.trim()
  if (ngrokDomain) return ngrokDomain.startsWith("http") ? ngrokDomain : `https://${ngrokDomain}`
  return process.env.NEXT_PUBLIC_VERSE_APP_URL?.trim()
}

/** Read and trim Customer Account API env so CRLF/whitespace never reach Shopify. */
export function getCustomerAccountApiConfig(request?: {
  nextUrl?: { origin?: string }
}): CustomerAccountApiConfig {
  const storeDomain = (
    process.env.NEXT_PUBLIC_STORE_DOMAIN ||
    process.env.PUBLIC_STORE_DOMAIN
  )?.trim()
  const clientId = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID ||
    process.env.NEXT_PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID
  )?.trim()
  const requestOrigin = request?.nextUrl?.origin?.trim()
  const appUrl = (
    isLocalhostOrigin(requestOrigin)
      ? getAppUrlForLocalhost()
      : requestOrigin
  ) ||
    process.env.NEXT_PUBLIC_VERSE_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()
  const authorizeUrl = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL ||
    process.env.CUSTOMER_ACCOUNT_API_AUTHORIZE_URL
  )?.trim()
  const tokenUrl = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN_URL ||
    process.env.CUSTOMER_ACCOUNT_API_TOKEN_URL
  )?.trim()
  const logoutUrl = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_LOGOUT_URL ||
    process.env.CUSTOMER_ACCOUNT_API_LOGOUT_URL
  )?.trim()

  return {
    storeDomain,
    clientId,
    appUrl: appUrl?.trim() || undefined,
    authorizeUrl: authorizeUrl || undefined,
    tokenUrl: tokenUrl || undefined,
    logoutUrl: logoutUrl?.trim() || undefined,
  }
}

/** Resolve end_session_endpoint from env or OpenID discovery. */
export async function getLogoutEndpoint(): Promise<string | null> {
  const config = getCustomerAccountApiConfig()
  if (config.logoutUrl) return config.logoutUrl
  const storeDomain = (
    process.env.NEXT_PUBLIC_STORE_DOMAIN ||
    process.env.PUBLIC_STORE_DOMAIN
  )?.trim()
  if (!storeDomain) return null
  const openidUrl = `https://${storeDomain}/.well-known/openid-configuration`
  const res = await fetch(openidUrl)
  if (!res.ok) return null
  const doc = (await res.json()) as { end_session_endpoint?: string }
  return doc.end_session_endpoint ?? null
}

const SESSION_MAX_AGE = 60 * 60; // 1 hour (matches token expiry)

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("base64url");
}

export function getCustomerSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: CUSTOMER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: isProduction,
    maxAge: SESSION_MAX_AGE,
  };
}
