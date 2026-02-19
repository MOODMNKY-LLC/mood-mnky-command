/**
 * Shopify Customer Account API - Logout.
 * GET: Clears cookie and redirects to Shopify logout for full SSO logout, then to /verse.
 * POST: Clears cookie only (for API clients).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionCookieOptions,
} from "@/lib/shopify/customer-account-auth";

function clearCookie(response: NextResponse) {
  const opts = getCustomerSessionCookieOptions();
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    ...opts,
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  // Prefer request origin for dual-domain; fallback to verse URL for post-logout redirect
  const appUrl = (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_VERSE_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim();
  const shopId = process.env.SHOP_ID?.trim();

  const postLogoutRedirect = `${appUrl}/verse`;

  const redirect = NextResponse.redirect(
    shopId
      ? `https://shopify.com/authentication/${shopId}/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirect)}`
      : postLogoutRedirect
  );
  return clearCookie(redirect);
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearCookie(response);
}
