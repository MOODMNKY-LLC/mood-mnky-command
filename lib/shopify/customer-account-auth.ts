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
}

/** True when origin is http://localhost (any port). Shopify requires HTTPS; use env app URL (e.g. ngrok) instead. */
function isLocalhostOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  return /^http:\/\/localhost(:\d+)?$/i.test(origin)
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
      ? undefined
      : requestOrigin
  ) ||
    process.env.NEXT_PUBLIC_VERSE_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL
  return { storeDomain, clientId, appUrl: appUrl?.trim() }
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
