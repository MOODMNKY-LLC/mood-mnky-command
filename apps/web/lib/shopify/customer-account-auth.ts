/**
 * PKCE and config helpers for Shopify Customer Account API OAuth 2.0.
 * Uses Node crypto for server-side PKCE generation.
 * Config trims env vars to avoid CRLF/whitespace causing "invalid client credentials" from Shopify.
 */

import crypto from "node:crypto";

export const CUSTOMER_SESSION_COOKIE = "__customer_session";

export type CustomerAccountApiConfig = {
  storeDomain: string | undefined;
  clientId: string | undefined;
  appUrl: string | undefined;
  authorizeUrl: string | undefined;
  tokenUrl: string | undefined;
  logoutUrl: string | undefined;
};

function isLocalhostOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return /^https?:\/\/localhost(:\d+)?$/i.test(origin);
}

function getAppUrlForLocalhost(): string | undefined {
  const fromApp = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromApp) return fromApp;
  const ngrokDomain = process.env.NGROK_DOMAIN?.trim();
  if (ngrokDomain)
    return ngrokDomain.startsWith("http")
      ? ngrokDomain
      : `https://${ngrokDomain}`;
  return process.env.NEXT_PUBLIC_VERSE_APP_URL?.trim();
}

export function getCustomerAccountApiConfig(request?: {
  nextUrl?: { origin?: string };
}): CustomerAccountApiConfig {
  const storeDomain = (
    process.env.NEXT_PUBLIC_STORE_DOMAIN ||
    process.env.PUBLIC_STORE_DOMAIN
  )?.trim();
  const clientId = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID ||
    process.env.NEXT_PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID
  )?.trim();
  const requestOrigin = request?.nextUrl?.origin?.trim();
  const appUrl =
    (isLocalhostOrigin(requestOrigin) ? getAppUrlForLocalhost() : requestOrigin) ||
    process.env.NEXT_PUBLIC_VERSE_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  const authorizeUrl = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL ||
    process.env.CUSTOMER_ACCOUNT_API_AUTHORIZE_URL
  )?.trim();
  const tokenUrl = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN_URL ||
    process.env.CUSTOMER_ACCOUNT_API_TOKEN_URL
  )?.trim();
  const logoutUrl = (
    process.env.PUBLIC_CUSTOMER_ACCOUNT_API_LOGOUT_URL ||
    process.env.CUSTOMER_ACCOUNT_API_LOGOUT_URL
  )?.trim();

  return {
    storeDomain,
    clientId,
    appUrl: appUrl?.trim() || undefined,
    authorizeUrl: authorizeUrl || undefined,
    tokenUrl: tokenUrl || undefined,
    logoutUrl: logoutUrl?.trim() || undefined,
  };
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.randomBytes(32));
}

export function generateCodeChallenge(verifier: string): string {
  return base64UrlEncode(
    crypto.createHash("sha256").update(verifier).digest()
  );
}

export function generateState(): string {
  return base64UrlEncode(crypto.randomBytes(16));
}

export function getCustomerSessionCookieOptions(): {
  httpOnly: boolean;
  path: string;
  sameSite: "lax";
  secure?: boolean;
  maxAge?: number;
} {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
