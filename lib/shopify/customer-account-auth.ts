/**
 * PKCE and session helpers for Shopify Customer Account API OAuth 2.0.
 * Uses Node crypto for server-side PKCE generation.
 */

import crypto from "node:crypto";

export const CUSTOMER_SESSION_COOKIE = "__customer_session";
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
