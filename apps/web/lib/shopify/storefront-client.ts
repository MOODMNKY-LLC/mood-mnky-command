import {
  createStorefrontClient,
  type StorefrontClientReturn,
} from "@shopify/hydrogen-react";

const storeDomain =
  process.env.PUBLIC_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || "";
const publicToken = process.env.PUBLIC_STOREFRONT_API_TOKEN || "";
const privateToken = process.env.PRIVATE_STOREFRONT_API_TOKEN || "";

/**
 * Storefront API client for MNKY VERSE.
 * Use public token on client; use private token on server for initial data.
 */
export const storefrontClient: StorefrontClientReturn = createStorefrontClient({
  storeDomain,
  publicStorefrontToken: publicToken,
  privateStorefrontToken: privateToken,
  storefrontApiVersion: "2026-01",
});

/**
 * Extract buyer IP from request headers for Storefront API analytics.
 * Uses x-forwarded-for (client is first) or x-real-ip.
 */
function getBuyerIpFromHeaders(
  headers: Headers | { get: (name: string) => string | null }
): string | undefined {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || undefined;
  }
  const realIp = headers.get("x-real-ip");
  return realIp || undefined;
}

export type StorefrontFetchOptions = {
  /** Request headers; used to extract buyerIp for Storefront API analytics */
  headers?: Headers | { get: (name: string) => string | null };
};

/**
 * Server-side: fetch from Storefront API with private token.
 * Pass headers() from next/headers to include buyerIp for analytics.
 */
export async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: StorefrontFetchOptions
): Promise<T> {
  const buyerIp = options?.headers
    ? getBuyerIpFromHeaders(options.headers)
    : undefined;

  const response = await fetch(storefrontClient.getStorefrontApiUrl(), {
    method: "POST",
    headers: storefrontClient.getPrivateTokenHeaders(
      buyerIp ? { buyerIp } : undefined
    ),
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Storefront API error: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(
      `Storefront API errors: ${JSON.stringify(json.errors)}`
    );
  }
  return json.data as T;
}
