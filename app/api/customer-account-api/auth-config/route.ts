/**
 * Debug endpoint: returns the Customer Account API callback URL for this origin.
 * No secrets. Use to verify Shopify "Allowed redirect URLs" configuration.
 * GET /api/customer-account-api/auth-config
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = (
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_VERSE_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim();
  const callbackUrl = origin
    ? `${origin}/api/customer-account-api/callback`
    : "";

  return NextResponse.json({
    callbackUrl,
    hint: "Add this URL to Shopify Admin → Your app → Customer Account API → Allowed redirect URLs.",
  });
}
