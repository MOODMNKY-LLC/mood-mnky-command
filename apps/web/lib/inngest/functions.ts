import { match } from "ts-pattern"
import { inngest } from "./client"
import { createAdminClient } from "@/lib/supabase/admin"
import { isProfileEligibleForXp } from "@/lib/xp-eligibility"
import { getDefaultGuildId, discordJson, parseRateLimitError } from "@/lib/discord/api"
import { decryptWebhookToken } from "@/lib/discord/webhook-token"

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

    const { count } = await supabase
      .from("xp_ledger")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("source", "purchase")
    const isFirstOrder = (count ?? 0) === 1
    if (isFirstOrder) {
      const { data: signupEvent } = await supabase
        .from("referral_events")
        .select("code_used")
        .eq("referee_id", profileId)
        .eq("event_type", "signed_up")
        .limit(1)
        .maybeSingle()
      if (signupEvent?.code_used) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.VERCEL_URL ||
          "http://localhost:3000"
        const apiKey = process.env.MOODMNKY_API_KEY
        if (apiKey) {
          await fetch(`${baseUrl.replace(/\/$/, "")}/api/referral/apply`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: signupEvent.code_used,
              refereeId: profileId,
              eventType: "first_order",
            }),
          })
        }
      }
    }

    return { xp, profileId }
  }
)

/**
 * Optional: reverse XP when order is cancelled or refunded.
 * Policy: one clawback per order (idempotent by source_ref order_refund:orderId).
 */
export const shopifyOrderCancelledOrRefunded = inngest.createFunction(
  {
    id: "shopify-order-cancelled-or-refunded",
    name: "Shopify order cancelled or refunded – optional XP clawback",
  },
  { event: "shopify/order.cancelled_or_refunded" },
  async ({ event }) => {
    const payload = event.data.payload as { id?: number; order_id?: number }
    const orderId = String(payload?.id ?? payload?.order_id ?? "")
    if (!orderId) return { skipped: true, reason: "no order id" }

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from("xp_ledger")
      .select("id")
      .eq("source", "order_refund")
      .eq("source_ref", orderId)
      .limit(1)
      .maybeSingle()
    if (existing) return { skipped: true, reason: "already reversed", orderId }

    const { data: purchaseRow } = await supabase
      .from("xp_ledger")
      .select("profile_id, xp_delta")
      .eq("source", "purchase")
      .eq("source_ref", orderId)
      .limit(1)
      .maybeSingle()

    if (!purchaseRow || purchaseRow.xp_delta <= 0) {
      return { skipped: true, reason: "no purchase XP to reverse", orderId }
    }

    await supabase.rpc("award_xp", {
      p_profile_id: purchaseRow.profile_id,
      p_source: "order_refund",
      p_source_ref: orderId,
      p_xp_delta: -purchaseRow.xp_delta,
      p_reason: "Order cancelled or refunded",
    })
    return { reversed: purchaseRow.xp_delta, orderId, profileId: purchaseRow.profile_id }
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
  async ({ event, step }) => {
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

/** Discord webhook base URL */
const DISCORD_WEBHOOK_BASE = "https://discord.com/api/v10"

export const discordDropAnnounce = inngest.createFunction(
  {
    id: "discord-drop-announce",
    name: "Discord drop announcement – post to stored webhook when issue published",
  },
  { event: "manga/issue.published" },
  async ({ event }) => {
    const payload = event.data as {
      issueId: string
      slug: string
      title: string
      arc_summary?: string | null
    }
    const guildId = getDefaultGuildId()
    if (!guildId) return { skipped: true, reason: "DISCORD_GUILD_ID_MNKY_VERSE not set" }

    const supabase = createAdminClient()
    const { data: webhookRow, error: webhookError } = await supabase
      .from("discord_webhooks")
      .select("id, webhook_id, token_encrypted")
      .eq("guild_id", guildId)
      .order("last_used_at", { ascending: false, nullsFirst: true })
      .limit(1)
      .maybeSingle()

    if (webhookError || !webhookRow?.token_encrypted) {
      return { skipped: true, reason: "No stored webhook for guild" }
    }

    let token: string
    try {
      token = decryptWebhookToken(webhookRow.token_encrypted)
    } catch {
      return { skipped: true, reason: "Failed to decrypt webhook token" }
    }

    const verseBase =
      process.env.NEXT_PUBLIC_VERSE_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://mnky-verse.moodmnky.com"
    const dropUrl = `${verseBase.replace(/\/$/, "")}/verse/drops/${payload.slug}`

    const embed = {
      title: payload.title,
      description:
        (payload.arc_summary && payload.arc_summary.slice(0, 1500)) || "New drop in the MNKY VERSE.",
      url: dropUrl,
      color: 0x5865f2,
    }

    const res = await fetch(
      `${DISCORD_WEBHOOK_BASE}/webhooks/${webhookRow.webhook_id}/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      }
    )

    if (res.status === 429) {
      const data = (await res.json().catch(() => ({}))) as { retry_after?: number }
      throw new Error(
        `Discord rate limit; retry after ${data.retry_after ?? 1}s`
      )
    }
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Discord webhook ${res.status}: ${text}`)
    }

    await supabase
      .from("discord_webhooks")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", webhookRow.id)

    return { ok: true, webhookId: webhookRow.webhook_id }
  }
)

/** Parse DISCORD_LEVEL_ROLES env: "1:roleId1,2:roleId2,..." → Map<level, roleId> */
function getLevelRoleMap(): Map<number, string> {
  const raw = process.env.DISCORD_LEVEL_ROLES
  const map = new Map<number, string>()
  if (!raw?.trim()) return map
  for (const part of raw.split(",")) {
    const [levelStr, roleId] = part.split(":").map((s) => s?.trim())
    const level = parseInt(levelStr ?? "", 10)
    if (Number.isFinite(level) && roleId) map.set(level, roleId)
  }
  return map
}

export const discordRoleSyncByLevel = inngest.createFunction(
  {
    id: "discord-role-sync-by-level",
    name: "Discord role sync by XP level",
    concurrency: { limit: 1 },
    retries: 2,
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const guildId = getDefaultGuildId()
    if (!guildId) return { skipped: true, reason: "DISCORD_GUILD_ID_MNKY_VERSE not set" }

    const levelRoles = getLevelRoleMap()
    if (levelRoles.size === 0)
      return { skipped: true, reason: "DISCORD_LEVEL_ROLES not set (e.g. 1:roleId1,2:roleId2)" }

    const supabase = createAdminClient()
    const { data: rows } = await supabase
      .from("profiles")
      .select("id, discord_user_id")
      .not("discord_user_id", "is", null)

    const profileIds = (rows ?? []).map((r) => r.id)
    if (profileIds.length === 0) return { processed: 0 }

    const { data: states } = await supabase
      .from("xp_state")
      .select("profile_id, level")
      .in("profile_id", profileIds)

    const levelByProfile = new Map(
      (states ?? []).map((s) => [s.profile_id, s.level as number])
    )

    const discordIds = (rows ?? []).map((r) => ({
      profileId: r.id,
      discordUserId: r.discord_user_id as string,
    }))

    const roleIds = Array.from(levelRoles.values())
    let processed = 0
    const delayMs = 1200

    for (const { profileId, discordUserId } of discordIds) {
      const level = levelByProfile.get(profileId) ?? 0
      const targetRoleId = Array.from(levelRoles.entries())
        .filter(([l]) => l <= level)
        .sort((a, b) => b[0] - a[0])[0]?.[1]

      try {
        for (const roleId of roleIds) {
          const isTarget = roleId === targetRoleId
          try {
            if (isTarget) {
              await discordJson(
                `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
                { method: "PUT", auditLogReason: "XP level sync" }
              )
            } else {
              await discordJson(
                `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
                { method: "DELETE", auditLogReason: "XP level sync" }
              )
            }
          } catch (e) {
            const rl = parseRateLimitError(e)
            if (rl) throw new Error(JSON.stringify({ retryAfter: rl.retryAfter }))
            if (!isTarget) continue
            throw e
          }
        }
        processed++
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes("retryAfter")) {
          try {
            const parsed = JSON.parse(msg) as { retryAfter: number }
            await step.sleep("rate-limit-wait", `${Math.ceil(parsed.retryAfter)}s`)
          } catch {
            // ignore
          }
        }
      }

      await step.sleep(`delay-${discordUserId}`, "2s")
    }

    return { processed }
  }
)
