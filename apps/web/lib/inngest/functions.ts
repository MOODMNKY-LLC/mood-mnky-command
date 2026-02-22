import { match } from "ts-pattern"
import { inngest } from "./client"
import { createAdminClient } from "@/lib/supabase/admin"
import { isProfileEligibleForXp } from "@/lib/xp-eligibility"

type QuestRequirement =
  | { type: "read_issue"; issueId: string }
  | { type: "discord_message"; eventType?: string; count?: number }
  | { type: "purchase"; minSubtotal?: number }
  | { type: "mag_quiz"; issueId?: string }
  | { type: "ugc_approved" }
  | { type: "xp_source"; source: string; minTotal?: number }

function normalizeReq(r: unknown): QuestRequirement | null {
  if (!r || typeof r !== "object" || !("type" in r)) return null
  const o = r as Record<string, unknown>
  const t = o.type as string
  if (t === "read_issue") return { type: "read_issue", issueId: String(o.issueId ?? o.issue_id ?? "") }
  if (t === "discord_message") return { type: "discord_message", eventType: (o.eventType ?? o.event_type) as string | undefined, count: Number(o.count ?? 1) }
  if (t === "purchase") return { type: "purchase", minSubtotal: Number(o.minSubtotal ?? o.min_subtotal ?? 0) || undefined }
  if (t === "mag_quiz") return { type: "mag_quiz", issueId: o.issueId as string | undefined }
  if (t === "ugc_approved") return { type: "ugc_approved" }
  if (t === "xp_source") return { type: "xp_source", source: String(o.source ?? ""), minTotal: Number(o.minTotal ?? o.min_total ?? 1) || undefined }
  return null
}

async function checkRequirement(
  supabase: ReturnType<typeof createAdminClient>,
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

function getPurchaseXpFromConfig(
  tiers: Array<{ subtotal_min: number; xp: number }>,
  subtotal: number
): number {
  const sorted = [...(tiers ?? [])].sort((a, b) => b.subtotal_min - a.subtotal_min)
  for (const t of sorted) {
    if (subtotal >= t.subtotal_min) return t.xp
  }
  return 0
}

export const shopifyOrderPaid = inngest.createFunction(
  { id: "shopify-order-paid", name: "Shopify order paid – award XP" },
  { event: "shopify/order.paid" },
  async ({ event, step }) => {
    const { orderId, profileId, subtotal } = event.data as {
      orderId: string
      profileId?: string
      subtotal: number
    }
    if (!profileId) return { skipped: true, reason: "no profileId" }

    const supabase = createAdminClient()
    const { data: config } = await supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "purchase")
      .maybeSingle()

    const tiers = (config?.value as { tiers?: Array<{ subtotal_min: number; xp: number }> } | null)?.tiers
    const xp = tiers?.length
      ? getPurchaseXpFromConfig(tiers, subtotal)
      : subtotal >= 75 ? 150 : subtotal >= 25 ? 50 : 0

    if (xp <= 0) return { xp: 0 }

    const eligible = await isProfileEligibleForXp(profileId)
    if (!eligible) return { xp: 0, reason: "subscription_required", profileId }

    await supabase.rpc("award_xp", {
      p_profile_id: profileId,
      p_source: "purchase",
      p_source_ref: orderId,
      p_xp_delta: xp,
      p_reason: `Order ${orderId} ($${subtotal})`,
    })
    return { xp, profileId }
  }
)

export const discordEventReceived = inngest.createFunction(
  { id: "discord-event-received", name: "Discord event – ledger + quest eval" },
  { event: "discord/event.received" },
  async ({ event, step }) => {
    const payload = event.data as {
      profileId: string
      discordUserId: string
      guildId: string
      channelId?: string
      eventType: string
      eventRef?: string
      value?: number
    }
    const supabase = createAdminClient()
    await supabase.from("discord_event_ledger").insert({
      profile_id: payload.profileId,
      discord_user_id: payload.discordUserId,
      guild_id: payload.guildId,
      channel_id: payload.channelId ?? null,
      event_type: payload.eventType,
      event_ref: payload.eventRef ?? null,
      value: payload.value ?? 1,
    })
    await step.sendEvent("quest-eval", {
      name: "quest/evaluate",
      data: { profileId: payload.profileId },
    })
    return { ok: true }
  }
)

export const questEvaluate = inngest.createFunction(
  { id: "quest-evaluate", name: "Evaluate quest progress for profile" },
  { event: "quest/evaluate" },
  async ({ event }) => {
    const { profileId } = event.data as { profileId: string }
    const supabase = createAdminClient()
    const { data: quests } = await supabase
      .from("quests")
      .select("id, rule")
      .eq("active", true)
    if (!quests?.length) return { evaluated: 0 }

    let completed = 0
    for (const q of quests) {
      const progress = await supabase
        .from("quest_progress")
        .select("progress, completed_at")
        .eq("profile_id", profileId)
        .eq("quest_id", q.id)
        .single()
      if (progress.data?.completed_at) continue

      const rule = q.rule as { requirements?: unknown[]; xpReward?: number }
      const rawReqs = rule?.requirements ?? []
      const requirements = rawReqs.map(normalizeReq).filter((r): r is QuestRequirement => r !== null)
      if (!requirements.length) continue

      const allMet = await Promise.all(
        requirements.map((r) => checkRequirement(supabase, profileId, r))
      ).then((results) => results.every(Boolean))

      if (!allMet) continue

      const xpReward = rule?.xpReward ?? 0
      await supabase.from("quest_progress").upsert(
        {
          profile_id: profileId,
          quest_id: q.id,
          progress: { completed: true },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,quest_id" }
      )
      if (xpReward > 0) {
        const eligible = await isProfileEligibleForXp(profileId)
        if (eligible) {
          await supabase.rpc("award_xp", {
            p_profile_id: profileId,
            p_source: "quest",
            p_source_ref: q.id,
            p_xp_delta: xpReward,
            p_reason: "Quest completed",
          })
        }
      }
      completed++
    }
    return { evaluated: quests.length, completed }
  }
)

export const magDownloadRecorded = inngest.createFunction(
  { id: "mag-download-recorded", name: "Manga download recorded – award XP (once per issue/type)" },
  { event: "mag/download.recorded" },
  async ({ event, step }) => {
    const { profileId, issueId, downloadType } = event.data as {
      profileId: string
      issueId: string
      downloadType: string
    }
    const sourceRef = `${issueId}:${downloadType}`
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from("xp_ledger")
      .select("id")
      .eq("profile_id", profileId)
      .eq("source", "mag_download")
      .eq("source_ref", sourceRef)
      .limit(1)
      .maybeSingle()

    if (existing) return { skipped: true, reason: "XP already awarded for this download" }

    const { data: config } = await supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "mag_download")
      .maybeSingle()

    const xp = (config?.value as { xp?: number } | null)?.xp ?? 25

    const eligible = await isProfileEligibleForXp(profileId)
    if (!eligible) return { xp: 0, reason: "subscription_required", profileId, issueId, downloadType }

    await supabase.rpc("award_xp", {
      p_profile_id: profileId,
      p_source: "mag_download",
      p_source_ref: sourceRef,
      p_xp_delta: xp,
      p_reason: `Downloaded ${downloadType} for manga issue`,
    })
    await step.sendEvent("quest-eval", {
      name: "quest/evaluate",
      data: { profileId },
    })
    return { xp, profileId, issueId, downloadType }
  }
)

export const magQuizPassed = inngest.createFunction(
  { id: "mag-quiz-passed", name: "Manga quiz passed – award XP (once per issue)" },
  { event: "mag/quiz.passed" },
  async ({ event, step }) => {
    const { profileId, issueId } = event.data as { profileId: string; issueId: string }
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from("xp_ledger")
      .select("id")
      .eq("profile_id", profileId)
      .eq("source", "mag_quiz")
      .eq("source_ref", issueId)
      .limit(1)
      .maybeSingle()

    if (existing) return { skipped: true, reason: "XP already awarded for this issue quiz" }

    const { data: config } = await supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "mag_quiz")
      .maybeSingle()

    const xp = (config?.value as { xp?: number } | null)?.xp ?? 75

    const eligible = await isProfileEligibleForXp(profileId)
    if (!eligible) return { xp: 0, reason: "subscription_required", profileId, issueId }

    await supabase.rpc("award_xp", {
      p_profile_id: profileId,
      p_source: "mag_quiz",
      p_source_ref: issueId,
      p_xp_delta: xp,
      p_reason: "Passed manga issue quiz",
    })
    await step.sendEvent("quest-eval", {
      name: "quest/evaluate",
      data: { profileId },
    })
    return { xp, profileId, issueId }
  }
)

export const magReadCompleted = inngest.createFunction(
  { id: "mag-read-completed", name: "Manga read completed – award XP (once per issue)" },
  { event: "mag/read.completed" },
  async ({ event, step }) => {
    const { profileId, issueId } = event.data as { profileId: string; issueId: string }
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from("xp_ledger")
      .select("id")
      .eq("profile_id", profileId)
      .eq("source", "mag_read")
      .eq("source_ref", issueId)
      .limit(1)
      .maybeSingle()

    if (existing) return { skipped: true, reason: "XP already awarded for this issue" }

    const { data: config } = await supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "mag_read")
      .maybeSingle()

    const xp = (config?.value as { xp?: number } | null)?.xp ?? 50

    const eligible = await isProfileEligibleForXp(profileId)
    if (!eligible) return { xp: 0, reason: "subscription_required", profileId, issueId }

    await supabase.rpc("award_xp", {
      p_profile_id: profileId,
      p_source: "mag_read",
      p_source_ref: issueId,
      p_xp_delta: xp,
      p_reason: "Completed manga chapter read",
    })
    await step.sendEvent("quest-eval", {
      name: "quest/evaluate",
      data: { profileId },
    })
    return { xp, profileId, issueId }
  }
)

export const ugcOnApproved = inngest.createFunction(
  { id: "ugc-on-approved", name: "UGC approved – award XP" },
  { event: "ugc/on.approved" },
  async ({ event }) => {
    const { submissionId, profileId, xpDelta } = event.data as {
      submissionId: string
      profileId: string
      xpDelta?: number
    }
    const supabase = createAdminClient()

    const { data: config } = await supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "ugc_approved")
      .maybeSingle()

    const xp = xpDelta ?? (config?.value as { xp?: number } | null)?.xp ?? 250

    const eligible = await isProfileEligibleForXp(profileId)
    if (!eligible) return { ok: true, reason: "subscription_required" }

    await supabase.rpc("award_xp", {
      p_profile_id: profileId,
      p_source: "ugc_approved",
      p_source_ref: submissionId,
      p_xp_delta: xp,
      p_reason: "UGC submission approved",
    })
    await step.sendEvent("quest-eval", {
      name: "quest/evaluate",
      data: { profileId },
    })
    return { ok: true }
  }
)
