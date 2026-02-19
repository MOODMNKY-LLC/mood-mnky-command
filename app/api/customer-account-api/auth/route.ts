/**
 * Shopify Customer Account API - OAuth initiation.
 * GET /api/customer-account-api/auth
 * Requires logged-in Supabase user. Generates PKCE params, stores verifier (with profile_id),
 * redirects to Shopify authorization.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCustomerAccountApiConfig,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "@/lib/shopify/customer-account-auth";

export async function GET(request: NextRequest) {
  try {
    const { storeDomain, clientId, appUrl, authorizeUrl: envAuthorizeUrl } =
      getCustomerAccountApiConfig(request);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", "/verse");
      loginUrl.searchParams.set("linkShopify", "1");
      return NextResponse.redirect(loginUrl.toString());
    }

    if (!storeDomain || !clientId || !appUrl) {
      const missing = [
        !storeDomain && "NEXT_PUBLIC_STORE_DOMAIN or PUBLIC_STORE_DOMAIN",
        !clientId && "PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID",
        !appUrl && "NEXT_PUBLIC_APP_URL or NGROK_DOMAIN (for localhost)",
      ].filter(Boolean);
      return NextResponse.json(
        {
          error: `Missing Customer Account API config: ${missing.join(", ")}. For local dev use ngrok and set NEXT_PUBLIC_APP_URL or NGROK_DOMAIN in .env.local.`,
        },
        { status: 500 }
      );
    }

    const authorizationEndpoint =
      envAuthorizeUrl ||
      (await (async () => {
        if (!storeDomain) return null;
        const openidConfigUrl = `https://${storeDomain}/.well-known/openid-configuration`;
        const openidResponse = await fetch(openidConfigUrl);
        if (!openidResponse.ok) return null;
        const openidConfig = (await openidResponse.json()) as {
          authorization_endpoint?: string;
        };
        return openidConfig.authorization_endpoint ?? null;
      })());

    if (!authorizationEndpoint) {
      return NextResponse.json(
        {
          error:
            "Could not get authorization endpoint. Set PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL (paste from Shopify Application endpoints) or ensure NEXT_PUBLIC_STORE_DOMAIN is correct.",
        },
        { status: 502 }
      );
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("customer_account_code_verifiers")
      .insert({ state, verifier: codeVerifier, profile_id: user.id });

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
    const envAppUrl = (
      process.env.NEXT_PUBLIC_VERSE_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      ""
    ).trim();
    const envLooksProduction =
      envAppUrl.includes("moodmnky.com") && !envAppUrl.includes("ngrok");
    if (isDevOrigin && envLooksProduction) {
      const needsHttps = callbackUrl.startsWith("http://");
      console.warn(
        `[Customer Account API] Request origin is localhost/ngrok but env app URL looks like production. Shopify requires HTTPS for redirect URLs.${needsHttps ? " Use ngrok (or similar) for local dev and add the https callback URL to Shopify Admin → your app → Allowed redirect URLs." : ` Add this URL to Shopify Admin → your app → Allowed redirect URLs: ${callbackUrl}`}`
      );
    }
    const authUrl = new URL(authorizationEndpoint);
    // clientId from getCustomerAccountApiConfig is trimmed to avoid CRLF in env causing invalid client credentials
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
