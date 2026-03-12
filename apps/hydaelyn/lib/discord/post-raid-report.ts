/**
 * Post Hydaelyn raid report summary to Discord channels via webhook.
 * Used when an import job completes (status → done).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportContext } from "@/lib/fflogs/fight-context";

export type Subscription = {
  id: string;
  webhook_url: string | null;
};

/**
 * Find discord_raid_report_subscriptions for this profile that match the report (filters.all or filters.reportCodes).
 */
export async function getReportSubscriptions(
  supabase: SupabaseClient,
  profileId: string,
  reportCode: string,
): Promise<Subscription[]> {
  const { data: rows, error } = await supabase
    .from("discord_raid_report_subscriptions")
    .select("id, webhook_url, filters")
    .eq("created_by", profileId)
    .not("webhook_url", "is", null);

  if (error || !rows?.length) return [];

  const out: Subscription[] = [];
  for (const r of rows) {
    const filters = (r.filters as { all?: boolean; reportCodes?: string[] }) ?? {};
    if (filters.all === true) {
      out.push({ id: r.id as string, webhook_url: r.webhook_url as string });
    } else if (Array.isArray(filters.reportCodes) && filters.reportCodes.includes(reportCode)) {
      out.push({ id: r.id as string, webhook_url: r.webhook_url as string });
    }
  }
  return out;
}

/**
 * Build Discord webhook payload (embed) from ReportContext.
 */
function buildEmbed(reportCode: string, ctx: ReportContext, reportUrl: string): { embeds: unknown[] } {
  const fightsSummary = ctx.fights
    .slice(0, 10)
    .map((f) => {
      const k = f.kill ? "Kill" : "Wipe";
      const dur = f.duration_ms != null ? `${(f.duration_ms / 1000).toFixed(0)}s` : "";
      const dps = f.party_dps != null ? ` · ${f.party_dps.toFixed(0)} DPS` : "";
      return `**${f.name ?? "Fight"}** — ${k} ${dur}${dps}`;
    })
    .join("\n");

  const description =
    (ctx.title ? `${ctx.title}\n\n` : "") +
    (fightsSummary || "No fight data.") +
    `\n\n[View report](${reportUrl})`;

  return {
    embeds: [
      {
        title: `Raid report: ${reportCode}`,
        description,
        color: 0x5c6bc0,
        url: reportUrl,
        footer: { text: "Hydaelyn · FFLogs import" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * POST to Discord webhook URL. Does not throw; returns ok: boolean.
 */
export async function postReportToWebhook(
  webhookUrl: string,
  reportCode: string,
  ctx: ReportContext,
  baseUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const reportUrl = `${baseUrl.replace(/\/$/, "")}/reports/${reportCode}`;
  const body = buildEmbed(reportCode, ctx, reportUrl);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return { ok: false, error: message };
  }
}
