import { match } from "ts-pattern"
import type { SupabaseClient } from "@supabase/supabase-js"

export type QuestRequirement =
  | { type: "read_issue"; issueId: string }
  | { type: "discord_message"; eventType?: string; count?: number }
  | { type: "purchase"; minSubtotal?: number }
  | { type: "mag_quiz"; issueId?: string }
  | { type: "ugc_approved" }
  | { type: "xp_source"; source: string; minTotal?: number }

export function normalizeQuestRequirement(r: unknown): QuestRequirement | null {
  if (!r || typeof r !== "object" || !("type" in r)) return null
  const o = r as Record<string, unknown>
  const t = o.type as string
  if (t === "read_issue")
    return { type: "read_issue", issueId: String(o.issueId ?? o.issue_id ?? "") }
  if (t === "discord_message")
    return {
      type: "discord_message",
      eventType: (o.eventType ?? o.event_type) as string | undefined,
      count: Number(o.count ?? 1),
    }
  if (t === "purchase")
    return {
      type: "purchase",
      minSubtotal: Number(o.minSubtotal ?? o.min_subtotal ?? 0) || undefined,
    }
  if (t === "mag_quiz")
    return { type: "mag_quiz", issueId: o.issueId as string | undefined }
  if (t === "ugc_approved") return { type: "ugc_approved" }
  if (t === "xp_source")
    return {
      type: "xp_source",
      source: String(o.source ?? ""),
      minTotal: Number(o.minTotal ?? o.min_total ?? 1) || undefined,
    }
  return null
}

export async function checkQuestRequirement(
  supabase: SupabaseClient,
  profileId: string,
  req: QuestRequirement
): Promise<boolean> {
  return match(req)
    .with({ type: "read_issue" }, async ({ issueId }) => {
      const { data } = await supabase
        .from("mnky_read_events")
        .select("id")
        .eq("profile_id", profileId)
        .eq("issue_id", issueId)
        .eq("completed", true)
        .gte("percent_read", 80)
        .gte("active_seconds", 90)
        .limit(1)
        .maybeSingle()
      return !!data
    })
    .with({ type: "discord_message" }, async ({ eventType, count = 1 }) => {
      let query = supabase
        .from("discord_event_ledger")
        .select("id")
        .eq("profile_id", profileId)
      if (eventType) query = query.eq("event_type", eventType)
      const { data: rows } = await query
      return (rows?.length ?? 0) >= count
    })
    .with({ type: "purchase" }, async ({ minSubtotal = 0 }) => {
      const { data } = await supabase
        .from("xp_ledger")
        .select("reason")
        .eq("profile_id", profileId)
        .eq("source", "purchase")
        .limit(1)
        .maybeSingle()
      if (!data?.reason) return false
      const match_ = data.reason.match(/\$(\d+(?:\.\d+)?)/)
      const subtotal = match_ ? parseFloat(match_[1]) : 0
      return subtotal >= minSubtotal
    })
    .with({ type: "mag_quiz" }, async ({ issueId }) => {
      let query = supabase
        .from("mnky_quiz_attempts")
        .select("id")
        .eq("profile_id", profileId)
        .eq("passed", true)
      if (issueId) query = query.eq("issue_id", issueId)
      const { data } = await query.limit(1).maybeSingle()
      return !!data
    })
    .with({ type: "ugc_approved" }, async () => {
      const { data } = await supabase
        .from("xp_ledger")
        .select("id")
        .eq("profile_id", profileId)
        .eq("source", "ugc_approved")
        .limit(1)
        .maybeSingle()
      return !!data
    })
    .with({ type: "xp_source" }, async ({ source, minTotal = 1 }) => {
      const { data } = await supabase
        .from("xp_ledger")
        .select("xp_delta")
        .eq("profile_id", profileId)
        .eq("source", source)
      const total = (data ?? []).reduce((s, r) => s + (r.xp_delta ?? 0), 0)
      return total >= minTotal
    })
    .otherwise(() => Promise.resolve(false))
}

export type QuestProgressItem = {
  questId: string
  completed: boolean
  metCount: number
  totalRequirements: number
}

type QuestWithRule = { id: string; rule: unknown }

/**
 * Returns per-quest progress (met count / total requirements) for a profile.
 * Use with admin client so all tables are readable.
 */
export async function getQuestProgressForProfile(
  supabase: SupabaseClient,
  profileId: string,
  quests: QuestWithRule[]
): Promise<QuestProgressItem[]> {
  const results: QuestProgressItem[] = []
  for (const q of quests) {
    const rule = q.rule as { requirements?: unknown[] }
    const rawReqs = rule?.requirements ?? []
    const requirements = rawReqs
      .map(normalizeQuestRequirement)
      .filter((r): r is QuestRequirement => r !== null)
    const total = requirements.length
    if (total === 0) {
      results.push({
        questId: q.id,
        completed: false,
        metCount: 0,
        totalRequirements: 0,
      })
      continue
    }
    const met = await Promise.all(
      requirements.map((r) => checkQuestRequirement(supabase, profileId, r))
    )
    const metCount = met.filter(Boolean).length
    results.push({
      questId: q.id,
      completed: metCount === total,
      metCount,
      totalRequirements: total,
    })
  }
  return results
}
