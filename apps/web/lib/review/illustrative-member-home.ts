/**
 * Isolated illustrative fixtures for /review/member-home.
 * Read-only sample data — never written to Supabase, never a real session.
 */

import type { PrivateServicePreviewItem } from "@/lib/private-services/preview-states"
import { ILLUSTRATIVE_PRIVATE_SERVICE_STATES } from "@/lib/private-services/preview-states"

export const ILLUSTRATIVE_MEMBER_HOME = {
  banner:
    "Illustrative preview — sample member home. Not a signed-in session. No account, VIP, or service rights are granted. Writes are disabled.",
  displayName: "Preview Member",
  email: "preview.member@example.invalid",
  xpTotal: 420,
  level: 3,
  savedBlendsCount: 2,
  wishlistCount: 1,
  shopifyLinked: false,
  scentPersonality: "warm_woody",
  favoriteNotes: "Cedar, Bergamot (sample)",
  quests: [
    {
      id: "preview-quest-1",
      title: "Sample scent quest",
      description: "Illustrative quest row — not tracked.",
      xpReward: 50,
      completed: false,
      action: { href: "/main", label: "Browse Main →" },
    },
    {
      id: "preview-quest-2",
      title: "Sample blend quest",
      description: "Illustrative completed quest — not real progress.",
      xpReward: 75,
      completed: true,
      action: null,
    },
  ],
  privateServices: ILLUSTRATIVE_PRIVATE_SERVICE_STATES as PrivateServicePreviewItem[],
  linkedAccounts: {
    shopify: { linked: false, linkUrl: "/auth/login" },
    discord: { linked: false, linkUrl: "/auth/login" },
    github: { linked: false, linkUrl: "/auth/login" },
  },
} as const
