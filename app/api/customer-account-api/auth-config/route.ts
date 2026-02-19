/**
 * Debug endpoint: returns the Customer Account API callback URL and setup hints.
 * No secrets. Use to verify Shopify config; optional env endpoints match "Application endpoints" panel.
 * GET /api/customer-account-api/auth-config
 */

import { NextRequest, NextResponse } from "next/server";
import { getCustomerAccountApiConfig } from "@/lib/shopify/customer-account-auth";

export async function GET(request: NextRequest) {
  const { appUrl, authorizeUrl, tokenUrl, logoutUrl, clientId, storeDomain } =
    getCustomerAccountApiConfig(request);
  const callbackUrl = appUrl
    ? `${appUrl.replace(/\/$/, "")}/api/customer-account-api/callback`
    : "";

  return NextResponse.json({
    callbackUrl,
    appUrl: appUrl || null,
    clientId: clientId ? `${clientId.slice(0, 8)}...` : null,
    storeDomain: storeDomain || null,
    endpoints: {
      authorize: authorizeUrl || (storeDomain ? `discovery from https://${storeDomain}/.well-known/openid-configuration` : null),
      token: tokenUrl || (storeDomain ? `discovery from https://${storeDomain}/.well-known/openid-configuration` : null),
      logout: logoutUrl || (storeDomain ? `discovery from https://${storeDomain}/.well-known/openid-configuration` : null),
    },
    whereToAddRedirect:
      "In the same Shopify app settings where you see 'Application endpoints' (Authorization / Token / Logout), find 'Allowed redirect URLs' or 'Customer Account API' → Redirect URIs and add the callbackUrl above exactly.",
    optionalEnvFromPanel:
      "To use the exact URLs from the Application endpoints panel, set PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL, PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN_URL, and optionally PUBLIC_CUSTOMER_ACCOUNT_API_LOGOUT_URL in .env.local.",
  });
}
