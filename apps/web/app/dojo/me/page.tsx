import { createClient } from "@/lib/supabase/server";
import { DojoWelcomeHero } from "@/components/dojo/dojo-welcome-hero";
import { DojoCharacterCard } from "@/components/dojo/dojo-character-card";
import { DojoXpCard } from "@/components/dojo/dojo-xp-card";
import {
  DojoQuestsCard,
  type QuestWithAction,
} from "@/components/dojo/dojo-quests-card";
import { DojoQuickActionsCard } from "@/components/dojo/dojo-quick-actions-card";
import { DojoHomeSections } from "@/components/dojo/dojo-home-sections";
import { DojoFreeTierOnboarding } from "@/components/dojo/dojo-free-tier-onboarding";
import { DojoFreeTierVerification } from "@/components/dojo/dojo-free-tier-verification";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

function getQuestAction(rule: unknown, issueSlugById: Record<string, string>): { href: string; label: string } | null {
  const r = rule as { requirements?: Array<{ type?: string; issueId?: string }> } | null;
  const req = r?.requirements?.[0];
  if (!req?.type) return null;
  if (req.type === "read_issue" && req.issueId) {
    const slug = issueSlugById[req.issueId];
    return slug ? { href: `/dojo/issues/${slug}`, label: "Read →" } : null;
  }
  if (req.type === "mag_quiz" && req.issueId) {
    const slug = issueSlugById[req.issueId];
    return slug ? { href: `/dojo/issues/${slug}/quiz`, label: "Take quiz →" } : null;
  }
  if (req.type === "purchase") return { href: "/dojo/products", label: "Shop →" };
  if (req.type === "ugc_approved") return { href: "/dojo/ugc", label: "Upload →" };
  return null;
}

export default async function DojoMePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profileId = user?.id;

  const [
    profileResult,
    xpResult,
    questsResult,
    progressResult,
    issuesResult,
    featuredResult,
    claimsResult,
    blendsCountResult,
    funnelResult,
    discordResult,
    identitiesResult,
  ] = await Promise.all([
    profileId
      ? supabase
          .from("profiles")
          .select("id, display_name, full_name, avatar_url, email, handle, shopify_customer_id, preferences, shopify_metafields_synced_at")
          .eq("id", profileId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    profileId
      ? supabase
          .from("xp_state")
          .select("xp_total, level, updated_at")
          .eq("profile_id", profileId)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("quests")
      .select("id, title, description, rule, xp_reward")
      .eq("active", true)
      .order("title"),
    profileId
      ? supabase
          .from("quest_progress")
          .select("quest_id, completed_at")
          .eq("profile_id", profileId)
      : Promise.resolve({ data: [] as { quest_id: string; completed_at: string | null }[] }),
    supabase.from("mnky_issues").select("id, slug, title"),
    supabase
      .from("mnky_issues")
      .select("slug, title")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    profileId
      ? supabase
          .from("reward_claims")
          .select(
            "id, status, issued_at, rewards(id, type, payload, min_level)"
          )
          .eq("profile_id", profileId)
          .order("issued_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from("saved_blends")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
      : Promise.resolve({ count: 0 }),
    user
      ? supabase
          .from("funnel_runs")
          .select("id, funnel_id")
          .eq("user_id", user.id)
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    profileId
      ? supabase
          .from("discord_event_ledger")
          .select("id")
          .eq("profile_id", profileId)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user ? supabase.auth.getUserIdentities() : Promise.resolve({ data: null }),
  ]);

  const xpTotal = xpResult.data?.xp_total ?? 0;
  const level = xpResult.data?.level ?? 1;
  const questsData = questsResult.data ?? [];
  const progressData = progressResult.data ?? [];
  const issuesData = issuesResult.data ?? [];
  const featuredSlugEnv = process.env.NEXT_PUBLIC_FEATURED_ISSUE_SLUG?.trim() || null;
  const featuredFromDb = featuredResult.data as { slug: string; title: string } | null;

  const issueSlugById: Record<string, string> = {};
  for (const i of issuesData as { id: string; slug: string }[]) {
    issueSlugById[i.id] = i.slug;
  }

  let featuredIssue: { slug: string; title: string } | null = null;
  if (featuredSlugEnv) {
    const bySlug = (issuesData as { slug: string; title: string }[])?.find(
      (row) => row.slug === featuredSlugEnv
    );
    if (bySlug) featuredIssue = { slug: bySlug.slug, title: bySlug.title };
    else featuredIssue = { slug: featuredSlugEnv, title: featuredSlugEnv };
  } else if (featuredFromDb) {
    featuredIssue = { slug: featuredFromDb.slug, title: featuredFromDb.title };
  }

  const progressByQuest: Record<string, boolean> = {};
  for (const p of progressData) {
    progressByQuest[p.quest_id] = p.completed_at != null;
  }

  const questsWithAction: QuestWithAction[] = questsData.map((q) => {
    const completed = progressByQuest[q.id];
    const action = getQuestAction(q.rule, issueSlugById);
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      xp_reward: q.xp_reward,
      status: completed ? "completed" : "in_progress",
      actionHref: action?.href,
      actionLabel: action?.label,
    };
  });

  const totalActive = questsData.length;
  const completedCount = progressData.filter((p) => p.completed_at != null).length;

  const profile = profileResult.data as {
    display_name?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
    handle?: string | null;
    shopify_customer_id?: string | null;
    subscription_tier?: "free" | "member" | null;
    preferences?: Record<string, unknown> | null;
    shopify_metafields_synced_at?: string | null;
  } | null;
  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
  const subscriptionTier = profile?.subscription_tier ?? null;
  const promptDismissedAt = typeof prefs.free_tier_prompt_dismissed_at === "string" ? prefs.free_tier_prompt_dismissed_at : null;
  const shopifyLinked = !!profile?.shopify_customer_id;
  const wishlistCount = Array.isArray(prefs?.wishlist) ? (prefs.wishlist as unknown[]).length : 0;
  const scentPersonality = String(prefs?.scent_personality ?? "");
  const lastSyncAt = profile?.shopify_metafields_synced_at ?? null;
  const favoriteNotes =
    Array.isArray(prefs.favorite_notes)
      ? (prefs.favorite_notes as string[]).join(", ")
      : typeof prefs.favorite_notes === "string"
        ? prefs.favorite_notes
        : "";
  const sizePreferences = (prefs.size_preferences ?? {}) as Record<string, string>;
  const savedBlendsCount = blendsCountResult.count ?? 0;
  const hasDiscordLink = !!discordResult.data;
  const identityList = (() => {
    const raw = (identitiesResult as { data?: unknown })?.data;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw as { provider?: string }[];
    const inner = (raw as { identities?: { provider?: string }[] }).identities;
    return Array.isArray(inner) ? inner : [];
  })();
  const hasGithubLink = identityList.some((i) => i?.provider === "github");

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
  const storeDomain =
    (process.env.NEXT_PUBLIC_STORE_DOMAIN ||
      process.env.PUBLIC_STORE_DOMAIN)?.trim() ?? "";
  const storeAccountUrl = storeDomain
    ? `https://${storeDomain}/account`
    : `${baseUrl}/dojo/me/profile`;

  const linkedAccounts = {
    shopify: {
      linked: shopifyLinked,
      linkUrl: `${baseUrl}/api/customer-account-api/auth`,
      manageUrl: storeAccountUrl,
    },
    discord: {
      linked: hasDiscordLink,
      linkUrl: `${baseUrl}/dojo/auth/discord/link`,
    },
    github: {
      linked: hasGithubLink,
      linkUrl: `${baseUrl}/dojo/auth/github/link`,
    },
  };

  let funnelProfile: Record<string, unknown> | null = null;
  if (funnelResult.data) {
    const run = funnelResult.data as { id: string; funnel_id: string };
    const { data: answers } = await supabase
      .from("funnel_answers")
      .select("question_key, answer")
      .eq("run_id", run.id);
    const { data: funnelDef } = await supabase
      .from("funnel_definitions")
      .select("question_mapping")
      .eq("id", run.funnel_id)
      .single();
    const mapping = (funnelDef?.question_mapping ?? {}) as Record<string, string>;
    const answersMap = (answers ?? []).reduce(
      (acc, { question_key, answer }) => {
        const val = (answer as { text?: string })?.text ?? answer;
        acc[question_key] = val;
        return acc;
      },
      {} as Record<string, unknown>
    );
    funnelProfile = {};
    for (const [semanticKey, qKey] of Object.entries(mapping)) {
      const val = answersMap[qKey];
      if (val !== undefined && val !== null && val !== "") {
        funnelProfile[semanticKey] = val;
      }
    }
    if (Object.keys(funnelProfile).length === 0) funnelProfile = null;
  }

  const claimsData = (claimsResult.data ?? []) as Array<{
    id: string;
    status: string;
    issued_at: string;
    rewards: { id: string; type: string; payload: Record<string, unknown>; min_level: number | null } | null;
  }>;
  const rewardClaims = claimsData.map((c) => ({
    id: c.id,
    status: c.status,
    issuedAt: c.issued_at,
    type: c.rewards?.type ?? "unknown",
    payload: c.rewards?.payload ?? {},
  }));

  const displayName = profile?.display_name ?? profile?.full_name ?? user?.email?.split("@")[0] ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DojoWelcomeHero displayName={displayName} isReturning={!!user} />
        <DojoFreeTierVerification subscriptionTier={subscriptionTier} />
      </div>
      <DojoFreeTierOnboarding
        subscriptionTier={subscriptionTier}
        promptDismissedAt={promptDismissedAt}
      />
      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DojoCharacterCard
          displayName={displayName}
          avatarUrl={profile?.avatar_url ?? null}
          email={user?.email ?? null}
          xpTotal={xpTotal}
          level={level}
          handle={profile?.handle}
          shopifyLinked={shopifyLinked}
        />
        <DojoXpCard xpTotal={xpTotal} level={level} />
        <DojoQuestsCard
          totalActive={totalActive}
          completedCount={completedCount}
          quests={questsWithAction}
        />
        <DojoQuickActionsCard />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-muted/50 p-4">
        <div
          className="absolute inset-0 overflow-hidden rounded-xl"
          aria-hidden
        >
          <AnimatedGridPattern
            numSquares={50}
            maxOpacity={0.15}
            duration={4}
            repeatDelay={0.5}
            width={40}
            height={40}
            className="fill-muted-foreground/15 stroke-muted-foreground/15"
          />
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-lg font-semibold">Your space</h2>
          <DojoHomeSections
            rewardClaims={rewardClaims}
            savedBlendsCount={savedBlendsCount}
            funnelProfile={funnelProfile}
            linkedAccounts={linkedAccounts}
            featuredIssue={featuredIssue}
            shopifyLinked={shopifyLinked}
            wishlistCount={wishlistCount}
            scentPersonality={scentPersonality}
            lastSyncAt={lastSyncAt}
            favoriteNotes={favoriteNotes}
            sizePreferences={sizePreferences}
          />
        </div>
      </div>
    </div>
  );
}
