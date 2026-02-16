"use client"

import React from "react"
import Link from "next/link"
import { ShimmerButton } from "@/components/ui/shimmer-button"

/**
 * CTA for MNKY VERSE - initiates Shopify Customer Account API OAuth flow.
 * Redirects to /api/customer-account-api/auth which handles PKCE and redirect to Shopify.
 * Uses NEXT_PUBLIC_APP_URL when it points to ngrok so localhost users get correct OAuth callback.
 */
export function LoginWithShopifyButton() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const useNgrokForAuth = appUrl?.includes("ngrok")
  const authHref = useNgrokForAuth
    ? `${appUrl.replace(/\/$/, "")}/api/customer-account-api/auth`
    : "/api/customer-account-api/auth"

  return (
    <Link href={authHref} className="block w-full">
      <ShimmerButton className="w-full">
        Login with Shopify
      </ShimmerButton>
    </Link>
  )
}
