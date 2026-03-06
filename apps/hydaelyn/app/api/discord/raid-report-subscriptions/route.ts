import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBodySchema = z.object({
  guild_id: z.string().min(1),
  channel_id: z.string().min(1),
  webhook_url: z.string().url().optional(),
  filters: z
    .object({
      all: z.boolean().optional(),
      reportCodes: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * GET /api/discord/raid-report-subscriptions
 * List current user's subscriptions (webhook_url is returned for management; treat as sensitive).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("discord_raid_report_subscriptions")
    .select("id, guild_id, channel_id, webhook_url, filters, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: data ?? [] });
}

/**
 * POST /api/discord/raid-report-subscriptions
 * Create a subscription. Body: { guild_id, channel_id, webhook_url?, filters? }.
 * filters: { all: true } to get all reports, or { reportCodes: ["code1"] } for specific reports.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { guild_id, channel_id, webhook_url, filters } = parsed.data;

  const { data: row, error } = await supabase
    .from("discord_raid_report_subscriptions")
    .insert({
      created_by: user.id,
      guild_id,
      channel_id,
      webhook_url: webhook_url ?? null,
      filters: filters ?? {},
    })
    .select("id, guild_id, channel_id, filters, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: row });
}
