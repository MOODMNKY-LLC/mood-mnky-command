/**
 * Shopify Customer Account API - OAuth callback.
 * GET /api/customer-account-api/callback
 * Exchanges code for token, stores token, sets session cookie, and when the user
 * is logged into Verse, persists their Shopify customer ID to profiles for order/XP linkage.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getCustomerAccountApiConfig,
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionCookieOptions,
} from "@/lib/shopify/customer-account-auth";
import { fetchCustomerWithToken } from "@/lib/shopify/customer-account-client";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    console.error("Customer Account API callback error:", errorParam);
    return NextResponse.redirect(
      new URL("/auth/login?error=shopify_auth_failed", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_params", request.url)
    );
  }

  try {
    const { storeDomain, clientId, appUrl, tokenUrl: envTokenUrl } =
      getCustomerAccountApiConfig(request);

    if (!storeDomain || !clientId || !appUrl) {
      return NextResponse.redirect(
        new URL("/auth/login?error=config", request.url)
      );
    }

    const supabase = createAdminClient();

    const { data: verifierRow, error: verifierError } = await supabase
      .from("customer_account_code_verifiers")
      .select("verifier, profile_id")
      .eq("state", state)
      .single();

    if (verifierError || !verifierRow) {
      console.error("Customer Account API: verifier not found", verifierError);
      return NextResponse.redirect(
        new URL("/auth/login?error=invalid_state", request.url)
      );
    }

    const serverSupabase = await createClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();
    // If we have a session and it doesn't match who started the link, reject
    if (user?.id != null && verifierRow.profile_id != null && user.id !== verifierRow.profile_id) {
      console.error("Customer Account API: profile_id mismatch");
      return NextResponse.redirect(
        new URL("/auth/login?error=shopify_session_mismatch", appUrl)
      );
    }

    const tokenEndpoint =
      envTokenUrl ||
      (storeDomain
        ? await (async () => {
            const openidConfigUrl = `https://${storeDomain}/.well-known/openid-configuration`;
            const openidResponse = await fetch(openidConfigUrl);
            if (!openidResponse.ok) return null;
            const openidConfig = (await openidResponse.json()) as {
              token_endpoint?: string;
            };
            return openidConfig.token_endpoint ?? null;
          })()
        : null);

    if (!tokenEndpoint) {
      return NextResponse.redirect(
        new URL("/auth/login?error=discovery_failed", request.url)
      );
    }

    const callbackUrl = `${appUrl}/api/customer-account-api/callback`;

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: callbackUrl,
        code,
        code_verifier: verifierRow.verifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error(
        "Customer Account API token exchange failed:",
        tokenResponse.status,
        errText
      );
      return NextResponse.redirect(
        new URL("/auth/login?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      expires_in?: number;
      refresh_token?: string;
      id_token?: string;
    };

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    const { data: tokenRow, error: insertError } = await supabase
      .from("customer_account_tokens")
      .insert({
        shop: storeDomain,
        access_token: tokenData.access_token,
        expires_at: expiresAt?.toISOString() ?? null,
        refresh_token: tokenData.refresh_token ?? null,
        id_token: tokenData.id_token ?? null,
      })
      .select("id")
      .single();

    if (insertError || !tokenRow) {
      console.error("Customer Account API: failed to store token", insertError);
      return NextResponse.redirect(
        new URL("/auth/login?error=storage_failed", request.url)
      );
    }

    await supabase
      .from("customer_account_code_verifiers")
      .delete()
      .eq("state", state);

    // Persist Shopify customer ID to profile. Use verifierRow.profile_id when session
    // cookie is missing (e.g. cross-site redirect from Shopify) so the link is still stored.
    const customer = await fetchCustomerWithToken(
      tokenData.access_token,
      storeDomain
    );
    const profileId = user?.id ?? verifierRow.profile_id ?? null;
    if (customer?.id && profileId) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ shopify_customer_id: customer.id })
        .eq("id", profileId);
      if (updateError) {
        console.error("Customer Account API: failed to update profile", updateError);
      }
    }

    // Use the request's origin so we always redirect back to the same host the user hit (avoids wrong host when proxied or env appUrl differs)
    const requestOrigin = url.origin;
    const versePath = "/verse?shopify=linked";
    const redirectUrl = `${requestOrigin}${versePath}`;
    const redirect = NextResponse.redirect(redirectUrl);
    const opts = getCustomerSessionCookieOptions();
    redirect.cookies.set(CUSTOMER_SESSION_COOKIE, tokenRow.id, {
      ...opts,
      maxAge: opts.maxAge ?? 3600,
    });

    return redirect;
  } catch (err) {
    console.error("Customer Account API callback error:", err);
    return NextResponse.redirect(
      new URL("/auth/login?error=callback_failed", request.url)
    );
  }
}
