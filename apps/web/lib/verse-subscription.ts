import { createClient } from "@/lib/supabase/server"

export type SubscriptionStatus = {
  isAuthenticated: boolean
  subscriptionTier: "free" | "member" | null
}

/**
 * Server-only: get current user's auth and subscription_tier for Verse free-tier gating and banners.
 */
export async function getVerseSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isAuthenticated: false, subscriptionTier: null }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single()

  const tier = profile?.subscription_tier ?? null
  return {
    isAuthenticated: true,
    subscriptionTier: tier === "free" || tier === "member" ? tier : null,
  }
}
