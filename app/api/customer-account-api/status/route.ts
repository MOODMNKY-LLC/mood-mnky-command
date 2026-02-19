/**
 * Returns whether the current request has a valid Shopify Customer Account session.
 * GET /api/customer-account-api/status
 * Response: { linked: boolean }
 */

import { NextResponse } from "next/server";
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client";

export async function GET() {
  const token = await getCustomerAccessToken();
  return NextResponse.json({ linked: !!token });
}
