/**
 * Dashboard layout and feature configuration.
 * Used by the dashboard page to render sections in order and to show/hide the LABZ hub card.
 * Can later be driven by env (e.g. NEXT_PUBLIC_DASHBOARD_SECTIONS) or a Supabase preferences table.
 */

export const DASHBOARD_SECTION_IDS = [
  "stats",
  "labzHub",
  "activityFeed",
  "quickActions",
  "shopifyStatus",
  "notionStatus",
] as const

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number]

export interface DashboardConfig {
  /** Ordered list of section IDs to render below the title. */
  sectionOrder: DashboardSectionId[]
  /** Whether to show the LABZ hub card (sync + LABZ Pages links). */
  showLabzHubCard: boolean
  /** SWR deduping interval for stats (ms). */
  defaultStatsRefreshInterval: number
  /** Whether to show LABZ pages count in the hub card or stats. */
  showLabzPagesCountInStats: boolean
  /** Whether to show the "Connect Notion and Shopify" alert when both are disconnected. */
  showConnectAlert: boolean
}

export const dashboardConfig: DashboardConfig = {
  sectionOrder: DASHBOARD_SECTION_IDS,
  showLabzHubCard: true,
  defaultStatsRefreshInterval: 30000,
  showLabzPagesCountInStats: true,
  showConnectAlert: true,
}
