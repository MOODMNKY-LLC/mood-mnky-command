/**
 * GraphQL client for Shopify Customer Account API.
 * Used for authenticated requests (orders, profile, etc.) once the customer
 * has completed OAuth and we have their access token.
 */

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/shopify/customer-account-auth";

const storeDomain =
  process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;

/**
 * Get the stored access token for the current customer session.
 * Returns null if not authenticated.
 */
export async function getCustomerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const tokenId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (!tokenId || !storeDomain) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_account_tokens")
    .select("access_token, expires_at")
    .eq("id", tokenId)
    .eq("shop", storeDomain)
    .single();

  if (error || !data?.access_token) return null;

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await supabase
      .from("customer_account_tokens")
      .delete()
      .eq("id", tokenId);
    return null;
  }

  return data.access_token;
}

/**
 * Fetch Customer Account API GraphQL endpoint URL from discovery.
 */
export async function getCustomerApiUrl(): Promise<string | null> {
  if (!storeDomain) return null;
  const wellKnownUrl = `https://${storeDomain}/.well-known/customer-account-api`;
  const res = await fetch(wellKnownUrl);
  if (!res.ok) return null;
  const config = (await res.json()) as {
    customer_account_api?: { api_url?: string };
  };
  return config.customer_account_api?.api_url ?? null;
}

/**
 * Run an authenticated GraphQL query against the Customer Account API.
 */
export async function customerAccountFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const accessToken = await getCustomerAccessToken();
  const apiUrl = await getCustomerApiUrl();

  if (!accessToken || !apiUrl) {
    throw new Error("Not authenticated with Customer Account API");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Customer Account API error: ${response.statusText}`);
  }

  const json = (await response.json()) as { data?: T; errors?: unknown[] };
  if (json.errors?.length) {
    throw new Error(
      `Customer Account API errors: ${JSON.stringify(json.errors)}`
    );
  }

  return json.data as T;
}

const CUSTOMER_QUERY = `
  query GetCurrentCustomer {
    customer {
      id
      displayName
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
`;

type CustomerPayload = {
  customer: {
    id: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    emailAddress?: { emailAddress?: string };
  };
};

/** Fetch customer from Customer Account API using a given access token (e.g. right after OAuth callback). */
export async function fetchCustomerWithToken(
  accessToken: string,
  storeDomain: string
): Promise<{ id: string; displayName?: string; email?: string } | null> {
  const wellKnownUrl = `https://${storeDomain}/.well-known/customer-account-api`;
  const res = await fetch(wellKnownUrl);
  if (!res.ok) return null;
  const config = (await res.json()) as {
    customer_account_api?: { api_url?: string };
  };
  const apiUrl = config.customer_account_api?.api_url;
  if (!apiUrl) return null;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: CUSTOMER_QUERY }),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { data?: CustomerPayload; errors?: unknown[] };
  if (json.errors?.length) return null;
  const c = json.data?.customer;
  if (!c) return null;
  return {
    id: c.id,
    displayName: c.displayName ?? undefined,
    email: c.emailAddress?.emailAddress ?? undefined,
  };
}

/** Fetch current customer from Customer Account API (uses session cookie). */
export async function getCurrentCustomer(): Promise<{
  id: string;
  displayName?: string;
  email?: string;
} | null> {
  try {
    const data = await customerAccountFetch<CustomerPayload>(CUSTOMER_QUERY);
    const c = data?.customer;
    if (!c) return null;
    return {
      id: c.id,
      displayName: c.displayName ?? undefined,
      email: c.emailAddress?.emailAddress ?? undefined,
    };
  } catch {
    return null;
  }
}
