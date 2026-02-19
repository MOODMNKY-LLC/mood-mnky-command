/**
 * Shopify Customer Account API - Logout.
 * GET: Clears cookie and redirects to Shopify end_session_endpoint (with id_token_hint when available), then to /verse.
 * POST: Clears cookie only (for API clients).
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionCookieOptions,
  getLogoutEndpoint,
} from "@/lib/shopify/customer-account-auth";

const storeDomain = (
  process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN
)?.trim();

function clearCookie(response: NextResponse) {
  const opts = getCustomerSessionCookieOptions();
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    ...opts,
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const appUrl = (
    request.nextUrl?.origin ||
    process.env.NEXT_PUBLIC_VERSE_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim();
  const postLogoutRedirect = `${appUrl}/verse`;

  let logoutUrl: string | null = null;
  let idToken: string | null = null;

  const cookieStore = await cookies();
  const tokenId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (tokenId && storeDomain) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("customer_account_tokens")
      .select("id_token")
      .eq("id", tokenId)
      .eq("shop", storeDomain)
      .single();
    if (data?.id_token) idToken = data.id_token;
  }

  logoutUrl = await getLogoutEndpoint();

  if (logoutUrl) {
    const params = new URLSearchParams();
    params.set("post_logout_redirect_uri", postLogoutRedirect);
    if (idToken) params.set("id_token_hint", idToken);
    const redirect = NextResponse.redirect(
      `${logoutUrl}?${params.toString()}`
    );
    return clearCookie(redirect);
  }

  const shopId = process.env.SHOP_ID?.trim();
  const fallbackRedirect = shopId
    ? `https://shopify.com/authentication/${shopId}/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirect)}`
    : postLogoutRedirect;
  return clearCookie(NextResponse.redirect(fallbackRedirect));
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearCookie(response);
}
