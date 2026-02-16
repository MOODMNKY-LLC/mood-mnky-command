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
 * Server-side: fetch from Storefront API with private token.
 */
export async function storefrontFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(storefrontClient.getStorefrontApiUrl(), {
    method: "POST",
    headers: storefrontClient.getPrivateTokenHeaders(),
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
