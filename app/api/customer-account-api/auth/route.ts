/**
 * Shopify Customer Account API - OAuth initiation.
 * GET /api/customer-account-api/auth
 * Generates PKCE params, stores verifier, redirects to Shopify authorization.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "@/lib/shopify/customer-account-auth";

export async function GET(request: NextRequest) {
  try {
    const storeDomain =
      process.env.NEXT_PUBLIC_STORE_DOMAIN ||
      process.env.PUBLIC_STORE_DOMAIN;
    const clientId =
      process.env.PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID ||
      process.env.NEXT_PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID;
    // Prefer request origin for dual-domain support (mnky-verse vs mnky-command)
    const appUrl =
      request.nextUrl.origin ||
      process.env.NEXT_PUBLIC_VERSE_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL;

    if (!storeDomain || !clientId || !appUrl) {
      return NextResponse.json(
        {
          error: "Missing Customer Account API config. Set NEXT_PUBLIC_STORE_DOMAIN, PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID, NEXT_PUBLIC_APP_URL.",
        },
        { status: 500 }
      );
    }

    const openidConfigUrl = `https://${storeDomain}/.well-known/openid-configuration`;
    const openidResponse = await fetch(openidConfigUrl);

    if (!openidResponse.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch OpenID config: ${openidResponse.statusText}`,
        },
        { status: 502 }
      );
    }

    const openidConfig = (await openidResponse.json()) as {
      authorization_endpoint: string;
    };
    const authorizationEndpoint = openidConfig.authorization_endpoint;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("customer_account_code_verifiers")
      .insert({ state, verifier: codeVerifier });

    if (error) {
      console.error("Customer Account API: failed to store verifier", error);
      return NextResponse.json(
        { error: "Failed to initiate auth" },
        { status: 500 }
      );
    }

    const callbackUrl = `${appUrl}/api/customer-account-api/callback`;
    const isDevOrigin =
      /^https?:\/\/localhost(\d*)/.test(appUrl) || appUrl.includes("ngrok");
    const envAppUrl =
      process.env.NEXT_PUBLIC_VERSE_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";
    const envLooksProduction =
      envAppUrl.includes("moodmnky.com") && !envAppUrl.includes("ngrok");
    if (isDevOrigin && envLooksProduction) {
      console.warn(
        "[Customer Account API] Request origin is localhost/ngrok but env app URL looks like production. Ensure Shopify Allowed redirect URLs include:",
        callbackUrl
      );
    }
    const authUrl = new URL(authorizationEndpoint);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("scope", "openid email customer-account-api:full");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("Customer Account API auth error:", err);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
