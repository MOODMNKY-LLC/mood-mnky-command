import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client";
import { DojoProfileClient } from "@/components/dojo/dojo-profile-client";
import { ChevronLeft } from "lucide-react";

const profileSelect =
  "display_name, full_name, username, handle, website, avatar_url, bio, email, last_sign_in_at, created_at, preferences, shopify_customer_id, role, default_chatflow_id";

function getStoreAccountUrl(): string | undefined {
  const domain =
    process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN;
  if (!domain?.trim()) return undefined;
  return `https://${domain.trim()}/account`;
}

export default async function DojoMeProfilePage({
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
    identitiesRes,
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
    supabase.auth.getUserIdentities(),
  ]);

  const profile = profileRes.data;
  const xpState = xpRes.data;
  const rewardClaimsCount = claimsCountRes.count ?? 0;
  const savedBlendsCount = blendsCountRes.count ?? 0;
  const hasFunnelSubmission = !!funnelRes.data;
  const discordLinked = !!discordRes.data;
  const shopifyLinked =
    !!(await getCustomerAccessToken()) || !!profile?.shopify_customer_id;
  const identityList = (() => {
    const raw = (identitiesRes as { data?: unknown })?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as { provider?: string }[];
    const inner = (raw as { identities?: { provider?: string }[] }).identities;
    return Array.isArray(inner) ? inner : [];
  })();
  const githubLinked = identityList.some((i) => i?.provider === "github");

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <Link
          href="/dojo/me"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dojo
        </Link>
      </div>
      <DojoProfileClient
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
        defaultChatflowId={(profile?.default_chatflow_id as string) ?? undefined}
        shopifyLinked={shopifyLinked}
        shopifyLinkedSuccess={shopifyLinkedSuccess}
        storeAccountUrl={getStoreAccountUrl()}
        discordLinked={discordLinked}
        githubLinked={githubLinked}
        xpTotal={xpState?.xp_total ?? 0}
        level={xpState?.level ?? 1}
        rewardClaimsCount={rewardClaimsCount}
        savedBlendsCount={savedBlendsCount}
        hasFunnelSubmission={hasFunnelSubmission}
        role={profile?.role ?? undefined}
      />
    </div>
  );
}
