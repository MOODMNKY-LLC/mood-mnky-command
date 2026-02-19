"use client"

import React from "react"
import { ShimmerButton } from "@/components/ui/shimmer-button"

/**
 * CTA for MNKY VERSE - initiates Shopify Customer Account API OAuth flow.
 * Uses a plain <a> so the browser does a full page navigation; OAuth redirects
 * must not be followed via fetch (CORS blocks cross-origin redirect to Shopify).
 */
export function LoginWithShopifyButton() {
  return (
    <a href="/api/customer-account-api/auth" className="block w-full">
      <ShimmerButton className="w-full">
        Login with Shopify
      </ShimmerButton>
    </a>
  )
}
