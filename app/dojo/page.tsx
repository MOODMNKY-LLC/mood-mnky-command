import { createClient } from "@/lib/supabase/server";
import { DojoWelcomeHero } from "@/components/dojo/dojo-welcome-hero";
import { DojoProfileSnapshot } from "@/components/dojo/dojo-profile-snapshot";
import { DojoXpCard } from "@/components/dojo/dojo-xp-card";
import {
  DojoQuestsCard,
  type QuestWithAction,
} from "@/components/dojo/dojo-quests-card";
import { DojoQuickActionsCard } from "@/components/dojo/dojo-quick-actions-card";
import { DojoHomeSections } from "@/components/dojo/dojo-home-sections";

function getQuestAction(rule: unknown, issueSlugById: Record<string, string>): { href: string; label: string } | null {
  const r = rule as { requirements?: Array<{ type?: string; issueId?: string }> } | null;
  const req = r?.requirements?.[0];
  if (!req?.type) return null;
  if (req.type === "read_issue" && req.issueId) {
    const slug = issueSlugById[req.issueId];
    return slug ? { href: `/verse/issues/${slug}`, label: "Read →" } : null;
  }
  if (req.type === "mag_quiz" && req.issueId) {
    const slug = issueSlugById[req.issueId];
    return slug ? { href: `/verse/issues/${slug}/quiz`, label: "Take quiz →" } : null;
  }
  if (req.type === "purchase") return { href: "/verse/shop", label: "Shop →" };
  if (req.type === "ugc_approved") return { href: "/verse/ugc", label: "Upload →" };
  return null;
}

export default async function DojoPage() {
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
    claimsResult,
    blendsCountResult,
    funnelResult,
    discordResult,
  ] = await Promise.all([
    profileId
      ? supabase
          .from("profiles")
          .select("id, display_name, full_name, avatar_url, email, handle, shopify_customer_id")
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
    supabase.from("mnky_issues").select("id, slug"),
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
  ]);

  const xpTotal = xpResult.data?.xp_total ?? 0;
  const level = xpResult.data?.level ?? 1;
  const questsData = questsResult.data ?? [];
  const progressData = progressResult.data ?? [];
  const issuesData = issuesResult.data ?? [];

  const issueSlugById: Record<string, string> = {};
  for (const i of issuesData) {
    issueSlugById[i.id] = i.slug;
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
  } | null;
  const savedBlendsCount = blendsCountResult.count ?? 0;
  const hasDiscordLink = !!discordResult.data;

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
      <DojoWelcomeHero displayName={displayName} isReturning={!!user} />
      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DojoProfileSnapshot
          displayName={displayName}
          avatarUrl={profile?.avatar_url ?? null}
          email={user?.email ?? null}
          xpTotal={xpTotal}
          level={level}
          handle={profile?.handle}
        />
        <DojoXpCard xpTotal={xpTotal} level={level} />
        <DojoQuestsCard
          totalActive={totalActive}
          completedCount={completedCount}
          quests={questsWithAction}
        />
        <DojoQuickActionsCard />
      </div>
      <div className="min-h-0 flex-1 space-y-4 rounded-xl bg-muted/50 p-4">
        <h2 className="text-lg font-semibold">Your space</h2>
        <DojoHomeSections
          rewardClaims={rewardClaims}
          savedBlendsCount={savedBlendsCount}
          funnelProfile={funnelProfile}
          linkedAccounts={{ discord: hasDiscordLink }}
        />
      </div>
    </div>
  );
}
