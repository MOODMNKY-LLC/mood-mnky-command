import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/dojo/profile
 * Aggregated profile data for Dojo home: profile, XP, rewards, saved blends, funnel submission, linked accounts.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = user.id;

  const [
    profileRes,
    xpRes,
    claimsRes,
    blendsCountRes,
    funnelRes,
    discordRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, full_name, avatar_url, email, handle, shopify_customer_id")
      .eq("id", profileId)
      .single(),
    supabase
      .from("xp_state")
      .select("xp_total, level")
      .eq("profile_id", profileId)
      .single(),
    supabase
      .from("reward_claims")
      .select("id, status, issued_at, rewards(type, payload)")
      .eq("profile_id", profileId)
      .order("issued_at", { ascending: false })
      .limit(10),
    supabase
      .from("saved_blends")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("funnel_runs")
      .select("id, funnel_id, submitted_at")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
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
  const claims = (claimsRes.data ?? []) as Array<{
    id: string;
    status: string;
    issued_at: string;
    rewards: { type: string; payload: Record<string, unknown> } | null;
  }>;
  const savedBlendsCount = blendsCountRes.count ?? 0;
  const hasDiscordLink = !!discordRes.data;
  const hasShopifyLink = !!(profile?.shopify_customer_id);

  let funnelProfile: Record<string, unknown> | null = null;
  if (funnelRes.data) {
    const funnelRun = funnelRes.data as { id: string; funnel_id?: string };
    const { data: answers } = await supabase
      .from("funnel_answers")
      .select("question_key, answer")
      .eq("run_id", funnelRun.id);
    const { data: funnelDef } = await supabase
      .from("funnel_definitions")
      .select("question_mapping")
      .eq("id", funnelRun.funnel_id ?? "")
      .single();
    const mapping = (funnelDef?.question_mapping ?? {}) as Record<string, string>;
    const answersMap = (answers ?? []).reduce(
      (acc, { question_key, answer }) => {
        acc[question_key] = (answer as { text?: string })?.text ?? answer;
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
  }

  return NextResponse.json({
    profile: profile
      ? {
          id: profile.id,
          displayName: profile.display_name ?? profile.full_name ?? user.email?.split("@")[0],
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          email: profile.email,
          handle: profile.handle,
        }
      : null,
    xp: xpState ? { xpTotal: xpState.xp_total, level: xpState.level } : { xpTotal: 0, level: 1 },
    rewards: claims.map((c) => ({
      id: c.id,
      status: c.status,
      issuedAt: c.issued_at,
      type: c.rewards?.type ?? "unknown",
      payload: c.rewards?.payload ?? {},
    })),
    savedBlendsCount,
    funnelProfile: funnelProfile && Object.keys(funnelProfile).length > 0 ? funnelProfile : null,
    linkedAccounts: {
      shopify: hasShopifyLink,
      discord: hasDiscordLink,
    },
  });
}
