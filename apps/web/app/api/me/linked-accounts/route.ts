import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client";

export type LinkedAccountsResponse = {
  shopify: { linked: boolean; linkUrl: string; manageUrl: string };
  discord: { linked: boolean; linkUrl: string };
  github: { linked: boolean; linkUrl: string };
};

function hasProvider(identitiesRes: { data?: unknown }, provider: string): boolean {
  const raw = identitiesRes.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { identities?: { provider?: string }[] })?.identities)
      ? (raw as { identities: { provider?: string }[] }).identities
      : [];
  return list.some((i: { provider?: string }) => i?.provider === provider);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = user.id;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const [profileRes, discordRes, identitiesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("shopify_customer_id")
      .eq("id", profileId)
      .single(),
    supabase
      .from("discord_event_ledger")
      .select("id")
      .eq("profile_id", profileId)
      .limit(1)
      .maybeSingle(),
    supabase.auth.getUserIdentities(),
  ]);

  const shopifyToken = await getCustomerAccessToken();
  const shopifyLinked =
    !!shopifyToken || !!profileRes.data?.shopify_customer_id;
  const discordLinked = !!discordRes.data;
  const githubLinked = hasProvider(identitiesRes, "github");

  const storeDomain =
    process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;
  const storeAccountUrl = storeDomain
    ? `https://${storeDomain.trim()}/account`
    : `${baseUrl}/dojo/profile`;

  const response: LinkedAccountsResponse = {
    shopify: {
      linked: shopifyLinked,
      linkUrl: `${baseUrl}/api/customer-account-api/auth`,
      manageUrl: storeAccountUrl,
    },
    discord: {
      linked: discordLinked,
      linkUrl: `${baseUrl}/verse/auth/discord/link`,
    },
    github: {
      linked: githubLinked,
      linkUrl: `${baseUrl}/verse/auth/github/link`,
    },
  };

  return NextResponse.json(response);
}
