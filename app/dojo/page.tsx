import { createClient } from "@/lib/supabase/server";
import { DojoXpCard } from "@/components/dojo/dojo-xp-card";
import {
  DojoQuestsCard,
  type QuestWithAction,
} from "@/components/dojo/dojo-quests-card";
import { DojoQuickActionsCard } from "@/components/dojo/dojo-quick-actions-card";
import { DojoLowerSection } from "@/components/dojo/dojo-lower-section";

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

  const [xpResult, questsResult, progressResult, issuesResult, claimsResult] =
    await Promise.all([
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <DojoXpCard xpTotal={xpTotal} level={level} />
        <DojoQuestsCard
          totalActive={totalActive}
          completedCount={completedCount}
          quests={questsWithAction}
        />
        <DojoQuickActionsCard />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4 md:min-h-min">
        <DojoLowerSection rewardClaims={rewardClaims} />
      </div>
    </div>
  );
}
