/**
 * GraphQL client and token helpers for Shopify Customer Account API.
 * Used for authenticated requests (orders, profile, etc.) once the customer
 * has completed OAuth and we have their access token stored in Supabase.
 */

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerAccountApiConfig,
} from "@/lib/shopify/customer-account-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

const storeDomain = (
  process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN
)?.trim();

const EXPIRY_BUFFER_MS = 60 * 1000; // refresh if access_token expires within 60s

function isExpiredOrExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt).getTime();
  return Date.now() >= expiry - EXPIRY_BUFFER_MS;
}

async function getTokenEndpoint(): Promise<string | null> {
  const config = getCustomerAccountApiConfig();
  if (config.tokenUrl) return config.tokenUrl;
  if (!storeDomain) return null;
  const openidUrl = `https://${storeDomain}/.well-known/openid-configuration`;
  const res = await fetch(openidUrl);
  if (!res.ok) return null;
  const doc = (await res.json()) as { token_endpoint?: string };
  return doc.token_endpoint ?? null;
}

type TokenRow = {
  id: string;
  access_token: string;
  expires_at: string | null;
  refresh_token: string | null;
};

export async function refreshCustomerAccessToken(
  supabase: SupabaseClient,
  row: TokenRow,
  tokenEndpoint: string,
  clientId: string
): Promise<string | null> {
  if (!row.refresh_token) return null;

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: row.refresh_token,
    }),
  });

  if (!res.ok) {
    if (res.status >= 400 && res.status < 500) return null;
    const body = await res.text();
    console.error("Customer Account API refresh failed:", res.status, body);
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    id_token?: string;
  };

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  const update: {
    access_token: string;
    expires_at: string | null;
    refresh_token?: string | null;
    id_token?: string | null;
  } = {
    access_token: data.access_token,
    expires_at: expiresAt,
  };
  if (data.refresh_token !== undefined) update.refresh_token = data.refresh_token;
  if (data.id_token !== undefined) update.id_token = data.id_token;

  const { error } = await supabase
    .from("customer_account_tokens")
    .update(update)
    .eq("id", row.id);

  if (error) {
    console.error(
      "Customer Account API: failed to update token after refresh",
      error
    );
    return null;
  }

  return data.access_token;
}

/**
 * Get the stored access token for the current customer session (cookie).
 * Refreshes the token if expired or expiring soon. Returns null if not authenticated or refresh fails.
 */
export async function getCustomerAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const tokenId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (!tokenId || !storeDomain) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customer_account_tokens")
    .select("id, access_token, expires_at, refresh_token")
    .eq("id", tokenId)
    .eq("shop", storeDomain)
    .single();

  if (error || !data?.access_token) return null;

  const row = data as TokenRow;

  if (!isExpiredOrExpiringSoon(row.expires_at)) {
    return row.access_token;
  }

  const tokenEndpoint = await getTokenEndpoint();
  const config = getCustomerAccountApiConfig();
  if (!tokenEndpoint || !config.clientId) {
    await supabase.from("customer_account_tokens").delete().eq("id", tokenId);
    return null;
  }

  const newToken = await refreshCustomerAccessToken(
    supabase,
    row,
    tokenEndpoint,
    config.clientId
  );

  if (newToken === null) {
    await supabase.from("customer_account_tokens").delete().eq("id", tokenId);
    return null;
  }

  return newToken;
}

/**
 * Get access token for a given profile (server-side "on behalf of").
 * Use for server actions, webhooks, or background jobs that act on behalf of a linked customer.
 */
export async function getAccessTokenForProfile(
  profileId: string,
  shop?: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const shopDomain = shop ?? storeDomain ?? undefined;
  if (!shopDomain) return null;

  const { data, error } = await supabase
    .from("customer_account_tokens")
    .select("id, access_token, expires_at, refresh_token")
    .eq("profile_id", profileId)
    .eq("shop", shopDomain)
    .maybeSingle();

  if (error || !data?.access_token) return null;

  const row = data as TokenRow;

  if (!isExpiredOrExpiringSoon(row.expires_at)) {
    return row.access_token;
  }

  const tokenEndpoint = await getTokenEndpoint();
  const config = getCustomerAccountApiConfig();
  if (!tokenEndpoint || !config.clientId) return null;

  return refreshCustomerAccessToken(
    supabase,
    row,
    tokenEndpoint,
    config.clientId
  );
}

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

export async function fetchCustomerWithToken(
  accessToken: string,
  domain: string
): Promise<{ id: string; displayName?: string; email?: string } | null> {
  const wellKnownUrl = `https://${domain}/.well-known/customer-account-api`;
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
  const json = (await response.json()) as {
    data?: CustomerPayload;
    errors?: unknown[];
  };
  if (json.errors?.length) return null;
  const c = json.data?.customer;
  if (!c) return null;
  return {
    id: c.id,
    displayName: c.displayName ?? undefined,
    email: c.emailAddress?.emailAddress ?? undefined,
  };
}

export async function getCurrentCustomer(): Promise<{
  id: string;
  displayName?: string;
  email?: string;
} | null> {
  try {
    const accessToken = await getCustomerAccessToken();
    if (!accessToken || !storeDomain) return null;
    return fetchCustomerWithToken(accessToken, storeDomain);
  } catch {
    return null;
  }
}
