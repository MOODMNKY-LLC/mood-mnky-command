"use client"

import React from "react"
import Link from "next/link"
import { ShimmerButton } from "@/components/ui/shimmer-button"

/**
 * CTA for MNKY VERSE - initiates Shopify Customer Account API OAuth flow.
 * Uses a relative URL so the browser always uses the current origin; the server
 * uses request.nextUrl.origin for redirect_uri when redirecting to Shopify.
 */
export function LoginWithShopifyButton() {
  return (
    <Link href="/api/customer-account-api/auth" className="block w-full">
      <ShimmerButton className="w-full">
        Login with Shopify
      </ShimmerButton>
    </Link>
  )
}
