/**
 * Shopify Customer Account API – Logout.
 * POST /api/customer-account-api/logout
 * Clears session cookie. Optionally calls Shopify end_session_endpoint with id_token_hint.
 * Does not delete the token row so the user can "reconnect" without full re-auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerAccountApiConfig,
  getCustomerSessionCookieOptions,
} from "@/lib/shopify/customer-account-auth";

async function handleLogout(request: NextRequest) {
  const cookieStore = request.cookies;
  const tokenId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (tokenId) {
    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from("customer_account_tokens")
      .select("id_token")
      .eq("id", tokenId)
      .single();

    const config = getCustomerAccountApiConfig(request);
    const logoutUrl = config.logoutUrl;
    if (row?.id_token && logoutUrl) {
      try {
        const endSessionUrl = new URL(logoutUrl);
        endSessionUrl.searchParams.set("id_token_hint", row.id_token);
        const appUrl = config.appUrl ?? request.nextUrl?.origin;
        if (appUrl) endSessionUrl.searchParams.set("post_logout_redirect_uri", appUrl);
        return NextResponse.redirect(endSessionUrl.toString());
      } catch {
        // Fall through to clear cookie and redirect
      }
    }
  }

  const redirectUrl = request.nextUrl?.origin
    ? `${request.nextUrl.origin}/auth/login`
    : "/auth/login";
  const res = NextResponse.redirect(redirectUrl);
  const opts = getCustomerSessionCookieOptions();
  res.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    ...opts,
    maxAge: 0,
  });
  return res;
}

export async function POST(request: NextRequest) {
  return await handleLogout(request);
}

export async function GET(request: NextRequest) {
  return await handleLogout(request);
}
