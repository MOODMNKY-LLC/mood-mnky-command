/**
 * Shopify Customer Account API – Connection status.
 * GET /api/customer-account-api/connection
 * Returns { linked, needsReconnect, email?, displayName? } for the current session.
 * displayName is used by the header tooltip to show verified Shopify user data.
 */

import { NextResponse } from "next/server";
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client";
import { getCurrentCustomer } from "@/lib/shopify/customer-account-client";

export async function GET() {
  try {
    const accessToken = await getCustomerAccessToken();
    if (!accessToken) {
      return NextResponse.json({
        linked: false,
        needsReconnect: false,
      });
    }
    const customer = await getCurrentCustomer();
    return NextResponse.json({
      linked: true,
      needsReconnect: false,
      email: customer?.email,
      displayName: customer?.displayName,
    });
  } catch {
    return NextResponse.json({
      linked: true,
      needsReconnect: true,
      email: undefined,
      displayName: undefined,
    });
  }
}
