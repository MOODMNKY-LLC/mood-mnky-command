"use client"

import { BadgeCheck } from "lucide-react"

export type DojoFreeTierVerificationProps = {
  subscriptionTier: "free" | "member" | null
}

export function DojoFreeTierVerification({ subscriptionTier }: DojoFreeTierVerificationProps) {
  const isSubscribed = subscriptionTier === "free" || subscriptionTier === "member"
  if (!isSubscribed) return null

  const label = subscriptionTier === "member" ? "Member" : "Free tier active"

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-sm text-emerald-700 dark:text-emerald-400">
      <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
