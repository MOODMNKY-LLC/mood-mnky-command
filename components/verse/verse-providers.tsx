"use client";

import { ShopifyProvider, CartProvider } from "@shopify/hydrogen-react";

const storeDomain =
  process.env.NEXT_PUBLIC_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
  process.env.SHOPIFY_STORE_DOMAIN ||
  "";
const publicToken =
  process.env.NEXT_PUBLIC_STOREFRONT_API_TOKEN ||
  process.env.PUBLIC_STOREFRONT_API_TOKEN ||
  "";
const storefrontId = process.env.NEXT_PUBLIC_STOREFRONT_ID || process.env.PUBLIC_STOREFRONT_ID || undefined;

export function VerseProviders({ children }: { children: React.ReactNode }) {
  if (!storeDomain || !publicToken) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        MNKY VERSE: Configure NEXT_PUBLIC_STORE_DOMAIN and
        NEXT_PUBLIC_STOREFRONT_API_TOKEN in .env. Install the Headless channel
        in Shopify Admin to get Storefront API tokens.
      </div>
    );
  }

  return (
    <ShopifyProvider
      storeDomain={storeDomain}
      storefrontToken={publicToken}
      storefrontId={storefrontId}
      storefrontApiVersion="2026-01"
      countryIsoCode="US"
      languageIsoCode="EN"
    >
      <CartProvider>{children}</CartProvider>
    </ShopifyProvider>
  );
}
