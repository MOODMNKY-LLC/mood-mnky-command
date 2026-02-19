import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client";
import { VerseProfileClient } from "./verse-profile-client";

const profileSelect =
  "display_name, full_name, username, handle, website, avatar_url, bio, email, last_sign_in_at, created_at, preferences, shopify_customer_id";

function getStoreAccountUrl(): string | undefined {
  const domain = process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;
  if (!domain?.trim()) return undefined;
  return `https://${domain.trim()}/account`;
}

export default async function VerseProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ shopify?: string }>;
}) {
  const params = await searchParams;
  const shopifyLinkedSuccess = params.shopify === "linked";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profileId = user.id;

  const [
    profileRes,
    xpRes,
    claimsCountRes,
    blendsCountRes,
    funnelRes,
    discordRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(profileSelect)
      .eq("id", profileId)
      .single(),
    supabase
      .from("xp_state")
      .select("xp_total, level")
      .eq("profile_id", profileId)
      .single(),
    supabase
      .from("reward_claims")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId),
    supabase
      .from("saved_blends")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("funnel_runs")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("discord_event_ledger")
      .select("id")
      .eq("profile_id", profileId)
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const xpState = xpRes.data;
  const rewardClaimsCount = claimsCountRes.count ?? 0;
  const savedBlendsCount = blendsCountRes.count ?? 0;
  const hasFunnelSubmission = !!funnelRes.data;
  const discordLinked = !!discordRes.data;
  const shopifyLinked = !!(await getCustomerAccessToken()) || !!profile?.shopify_customer_id;

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <VerseProfileClient
        userId={user.id}
        email={user.email ?? profile?.email ?? ""}
        displayName={profile?.display_name ?? undefined}
        fullName={profile?.full_name ?? undefined}
        username={profile?.username ?? undefined}
        handle={profile?.handle ?? undefined}
        website={profile?.website ?? undefined}
        avatarUrl={profile?.avatar_url ?? undefined}
        bio={profile?.bio ?? undefined}
        lastSignInAt={profile?.last_sign_in_at ?? undefined}
        createdAt={profile?.created_at ?? undefined}
        defaultAgentSlug={(profile?.preferences?.default_agent_slug as string) ?? "mood_mnky"}
        shopifyLinked={shopifyLinked}
        shopifyLinkedSuccess={shopifyLinkedSuccess}
        storeAccountUrl={getStoreAccountUrl()}
        discordLinked={discordLinked}
        xpTotal={xpState?.xp_total ?? 0}
        level={xpState?.level ?? 1}
        rewardClaimsCount={rewardClaimsCount}
        savedBlendsCount={savedBlendsCount}
        hasFunnelSubmission={hasFunnelSubmission}
      />
    </div>
  );
}
