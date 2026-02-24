/**
 * VIP tier display names from config_xp_rules (vip_tiers).
 * Fallback to "Level N" when config missing or level not in list.
 */

export type VipTierEntry = { level: number; name: string }

const DEFAULT_TIERS: VipTierEntry[] = [
  { level: 1, name: "Bronze" },
  { level: 2, name: "Silver" },
  { level: 3, name: "Gold" },
  { level: 4, name: "Platinum" },
  { level: 5, name: "Diamond" },
]

export function getTierName(
  level: number,
  tiers: VipTierEntry[] | null
): string {
  const list = tiers && tiers.length > 0 ? tiers : DEFAULT_TIERS
  const entry = list.find((t) => t.level === level)
  return entry?.name ?? `Level ${level}`
}

export function parseVipTiersFromConfig(
  value: unknown
): VipTierEntry[] | null {
  if (!Array.isArray(value)) return null
  const out: VipTierEntry[] = []
  for (const item of value) {
    if (item && typeof item === "object" && "level" in item && "name" in item) {
      const level = Number((item as { level: unknown }).level)
      const name = String((item as { name: unknown }).name)
      if (Number.isInteger(level) && name) out.push({ level, name })
    }
  }
  return out.length ? out : null
}
