"use client"

import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Box,
  Calendar,
  Film,
  FolderSync,
  Gamepad2,
  Gift,
  HardDrive,
  Package,
  Server,
  Sparkles,
  Wrench,
  Workflow,
} from "lucide-react"
import {
  SiJellyfin,
  SiLangchain,
  SiN8N,
  SiNextcloud,
  SiOpenai,
  SiShopify,
  SiSteam,
  SiSupabase,
  SiTruenas,
} from "react-icons/si"
import type { MainServiceItem } from "@/lib/main-services-data"

export type ServiceIconEntry = {
  label: string
  Icon: LucideIcon | React.ComponentType<{ className?: string; size?: number }>
}

/** Map feature substring or slug to icon. Prefer Simple Icons; fallback to Lucide. */
const FEATURE_ICON_MAP: Array<{
  match: RegExp | string
  label: string
  Icon: LucideIcon | React.ComponentType<{ className?: string; size?: number }>
}> = [
  { match: /nextcloud/i, label: "Nextcloud", Icon: SiNextcloud },
  { match: /jellyfin/i, label: "Jellyfin", Icon: SiJellyfin },
  { match: /jellyseerr|prowlarr|radarr|sonarr|lidarr/i, label: "Media stack", Icon: Film },
  { match: /calibre|e-books/i, label: "Calibre", Icon: BookOpen },
  { match: /truenas/i, label: "TrueNAS", Icon: SiTruenas },
  { match: /n8n/i, label: "n8n", Icon: SiN8N },
  { match: /flowise/i, label: "Flowise", Icon: Workflow },
  { match: /langchain/i, label: "LangChain", Icon: SiLangchain },
  { match: /openai/i, label: "OpenAI", Icon: SiOpenai },
  { match: /supabase/i, label: "Supabase", Icon: SiSupabase },
  { match: /shopify/i, label: "Shopify", Icon: SiShopify },
  { match: /steam/i, label: "Steam", Icon: SiSteam },
  { match: /palworld|game servers/i, label: "Game servers", Icon: Gamepad2 },
  { match: /file sync|sync & share/i, label: "File sync", Icon: FolderSync },
  { match: /calendar|contacts/i, label: "Calendar & contacts", Icon: Calendar },
  { match: /zfs|snapshots|replication|smb|nfs|remote access/i, label: "Storage", Icon: HardDrive },
  { match: /self-hosted|managed hosting/i, label: "Hosting", Icon: Server },
  { match: /quarterly|drop boxes|subscription/i, label: "Subscription", Icon: Package },
  { match: /bespoke content|gamification/i, label: "Content", Icon: Gift },
  { match: /custom tools|providers/i, label: "Custom tools", Icon: Wrench },
  { match: /community/i, label: "Community", Icon: Sparkles },
]

/** Per-service explicit tech icons (for tech row). When defined, used instead of feature-derived. */
const SERVICE_ICON_SLUGS: Record<string, string[]> = {
  "mnky-cloud": ["nextcloud"],
  "mnky-media": ["jellyfin"],
  "mnky-drive": ["truenas"],
  "mnky-auto": ["n8n", "flowise", "openai", "supabase", "langchain"],
  "mnky-agents": ["openai", "supabase", "flowise", "langchain"],
  "mnky-games": ["steam"],
  "mood-mnky-experience": ["shopify"],
}

const SLUG_TO_ICON: Record<string, { label: string; Icon: LucideIcon | React.ComponentType<{ className?: string; size?: number }> }> = {
  nextcloud: { label: "Nextcloud", Icon: SiNextcloud },
  jellyfin: { label: "Jellyfin", Icon: SiJellyfin },
  truenas: { label: "TrueNAS", Icon: SiTruenas },
  n8n: { label: "n8n", Icon: SiN8N },
  openai: { label: "OpenAI", Icon: SiOpenai },
  supabase: { label: "Supabase", Icon: SiSupabase },
  langchain: { label: "LangChain", Icon: SiLangchain },
  shopify: { label: "Shopify", Icon: SiShopify },
  steam: { label: "Steam", Icon: SiSteam },
  flowise: { label: "Flowise", Icon: Workflow },
}

function getIconForFeature(feature: string): ServiceIconEntry | null {
  const normalized = feature.trim()
  for (const { match, label, Icon } of FEATURE_ICON_MAP) {
    if (typeof match === "string" ? normalized.toLowerCase().includes(match.toLowerCase()) : match.test(normalized)) {
      return { label, Icon }
    }
  }
  return null
}

/**
 * Returns tech icons for the service card: either from service.iconSlugs (Simple Icons slugs)
 * or derived from service.features. Deduplicated by label.
 */
export function getFeatureIcons(service: MainServiceItem): ServiceIconEntry[] {
  const seen = new Set<string>()
  const out: ServiceIconEntry[] = []

  if (service.iconSlugs?.length) {
    for (const slug of service.iconSlugs) {
      const entry = SLUG_TO_ICON[slug.toLowerCase()]
      if (entry && !seen.has(entry.label)) {
        seen.add(entry.label)
        out.push(entry)
      }
    }
    return out
  }

  const slugs = SERVICE_ICON_SLUGS[service.id]
  if (slugs) {
    for (const slug of slugs) {
      const entry = SLUG_TO_ICON[slug.toLowerCase()]
      if (entry && !seen.has(entry.label)) {
        seen.add(entry.label)
        out.push(entry)
      }
    }
    if (out.length > 0) return out
  }

  for (const feature of service.features) {
    const entry = getIconForFeature(feature)
    if (entry && !seen.has(entry.label)) {
      seen.add(entry.label)
      out.push(entry)
    }
  }

  if (out.length === 0) {
    out.push({ label: service.name, Icon: Box })
  }
  return out
}
