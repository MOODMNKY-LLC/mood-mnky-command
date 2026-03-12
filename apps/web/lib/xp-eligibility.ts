import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Server-only: true if the profile has claimed free tier or is a member (eligible to earn XP).
 * Used by /api/xp/award, Inngest XP flows, and UGC approve to gate awards on subscription.
 */
export async function isProfileEligibleForXp(profileId: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", profileId)
    .single()

  const tier = profile?.subscription_tier ?? null
  return tier === "free" || tier === "member"
}
