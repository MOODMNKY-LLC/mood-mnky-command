/**
 * Sidebar navigation configuration.
 * Single source for labels, order, and icons so the sidebar can be tuned without editing the component.
 */

import type { LucideIcon } from "lucide-react"
import {
  Bot,
  Droplets,
  LayoutDashboard,
  Package,
  FlaskConical,
  Palette,
  Flame,
  Database,
  Server,
  Table2,
  Terminal,
  Store,
  ShoppingCart,
  ClipboardList,
  Users,
  Tags,
  Megaphone,
  FileText,
  ListFilter,
  Wallet,
  MessageSquare,
  ImagePlus,
  Sparkles,
  Video,
  Mic,
  BookOpen,
  Globe,
  Plus,
  ChevronRight,
  Workflow,
  BookMarked,
  Trophy,
  Activity,
  HardDrive,
  BarChart3,
  Settings,
  Link2,
  Box,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export interface NavItemWithChildren extends NavItem {
  children?: { title: string; href: string }[]
}

/** @deprecated Use productDataItems + productBuilderItems + aiToolsItems. */
export const labItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Formulas", href: "/formulas", icon: FlaskConical },
  { title: "Fragrance Oils", href: "/fragrances", icon: Droplets },
  { title: "Glossary", href: "/glossary", icon: BookOpen },
  { title: "Blending Lab", href: "/blending", icon: Palette },
  { title: "Wicks & Wax", href: "/wicks", icon: Flame },
  { title: "Product Builder", href: "/products", icon: Package },
  { title: "CODE MNKY", href: "/code-mnky", icon: Bot },
]

/** Product Data: Dashboard, Formulas, Fragrance Oils, Glossary, Blending Lab, Wicks & Wax. */
export const productDataItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Formulas", href: "/formulas", icon: FlaskConical },
  { title: "Fragrance Oils", href: "/fragrances", icon: Droplets },
  { title: "Glossary", href: "/glossary", icon: BookOpen },
  { title: "Blending Lab", href: "/blending", icon: Palette },
  { title: "Wicks & Wax", href: "/wicks", icon: Flame },
]

/** Product Builder: single item. */
export const productBuilderItems: NavItem[] = [
  { title: "Product Builder", href: "/products", icon: Package },
]

/** Create & Chat with CODE MNKY first (AI Tools group). Eleven Labs is a parent with Verse/Chat and Main landing children. */
export const createAndChatItems: (NavItem | NavItemWithChildren)[] = [
  { title: "CODE MNKY", href: "/code-mnky", icon: Bot },
  { title: "AI Chat", href: "/chat", icon: MessageSquare },
  { title: "Agents", href: "/chat/agents", icon: Bot },
  {
    title: "Eleven Labs",
    href: "/chat/eleven-labs",
    icon: Mic,
    children: [
      { title: "Verse / Chat", href: "/chat/eleven-labs" },
      { title: "Main landing", href: "/chat/eleven-labs/main" },
    ],
  },
  { title: "Image Studio", href: "/studio", icon: Sparkles },
  { title: "Audio Studio", href: "/studio/audio", icon: Mic },
  { title: "Video Studio", href: "/studio/video", icon: Video },
  { title: "Media Library", href: "/media", icon: ImagePlus },
]

/** AI Tools = Create & Chat (includes CODE MNKY). Alias for clarity. */
export const aiToolsItems: (NavItem | NavItemWithChildren)[] = createAndChatItems

export const storeItems: NavItemWithChildren[] = [
  { title: "Store Overview", href: "/store", icon: Store },
  {
    title: "Catalog",
    href: "/store/products",
    icon: ShoppingCart,
    children: [
      { title: "Products", href: "/store/products" },
      { title: "Collections", href: "/store/collections" },
      { title: "Inventory", href: "/store/inventory" },
    ],
  },
  {
    title: "Sales",
    href: "/store/orders",
    icon: ClipboardList,
    children: [
      { title: "Orders", href: "/store/orders" },
      { title: "Customers", href: "/store/customers" },
      { title: "Discounts", href: "/store/discounts" },
    ],
  },
  {
    title: "Growth",
    href: "/store/marketing",
    icon: Megaphone,
    children: [
      { title: "Marketing", href: "/store/marketing" },
      { title: "Analytics", href: "/store/analytics" },
    ],
  },
  { title: "Content", href: "/store/content", icon: FileText },
  { title: "MNKY LABZ Pages", href: "/store/labz-pages", icon: FileText },
  { title: "Finance", href: "/store/finance", icon: Wallet },
]

/** Integrations: Notion Sync, etc. Extensible for future sources. */
export const integrationsItems: NavItem[] = [
  { title: "Notion Sync", href: "/notion", icon: Database },
  { title: "Flowise", href: "/platform/flowise", icon: Workflow },
  { title: "Discord", href: "/platform/discord", icon: MessageSquare },
]

/** @deprecated Use createAndChatItems; kept for backwards compatibility. */
export const mnkyChatItems: NavItem[] = createAndChatItems.slice(0, 3) as NavItem[]

/** @deprecated Use createAndChatItems; kept for backwards compatibility. */
export const studioItems: (NavItem | NavItemWithChildren)[] = createAndChatItems.slice(3, 7)

export const verseItems: NavItem[] = [
  { title: "MNKY VERSE", href: "/verse", icon: Globe },
  { title: "Products", href: "/verse/products", icon: Package },
  { title: "Collections", href: "/verse/collections", icon: Tags },
  { title: "Cart", href: "/verse/cart", icon: ShoppingCart },
  { title: "Discord", href: "/platform/discord", icon: MessageSquare },
]

/** Community (LAB sidebar group): Manga, XP & Quests, UGC, Discord events. */
export const verseBackofficeItems: NavItem[] = [
  { title: "Manga / Issues", href: "/verse-backoffice/manga", icon: BookMarked },
  { title: "Manga Collections", href: "/verse-backoffice/manga/collections", icon: Tags },
  { title: "XP & Quests", href: "/verse-backoffice/xp", icon: Trophy },
  { title: "UGC Moderation", href: "/verse-backoffice/ugc", icon: ImagePlus },
  { title: "Discord Events", href: "/verse-backoffice/discord-events", icon: Activity },
]

/** Verse group: public + backoffice for single collapsible "Verse" with sub-sections. */
export const verseItemsWithBackoffice = {
  public: verseItems,
  backoffice: verseBackofficeItems,
} as const

/** Platform: Data & Admin (tables, SQL, storage, members). */
export const platformDataAdminItems: NavItem[] = [
  { title: "Overview", href: "/platform", icon: Server },
  { title: "Table Editor", href: "/platform/tables", icon: Table2 },
  { title: "SQL Editor", href: "/platform/sql", icon: Terminal },
  { title: "Storage", href: "/platform/storage", icon: HardDrive },
  { title: "Members", href: "/members", icon: Users },
]

/** Platform: Automation & Workflows (funnels, Flowise, storefront assistant, deployed services, infra). */
export const platformAutomationItems: NavItem[] = [
  { title: "Funnels", href: "/platform/funnels", icon: ListFilter },
  { title: "Flowise", href: "/platform/flowise", icon: Workflow },
  { title: "Storefront Assistant", href: "/platform/storefront-assistant", icon: Bot },
  { title: "Service Analytics", href: "/platform/services", icon: BarChart3 },
  { title: "Infra Artifacts", href: "/platform/artifacts", icon: Box },
]

/** Platform: Settings and Integrations hub. */
export const platformSettingsItems: NavItem[] = [
  { title: "Settings", href: "/platform/settings", icon: Settings },
  { title: "Integrations", href: "/platform/integrations", icon: Link2 },
]

/** Platform (Supabase, funnels, tables, etc.). Combined for backward compatibility. */
export const platformItems: NavItem[] = [
  ...platformDataAdminItems,
  ...platformAutomationItems,
]

/** @deprecated Use platformItems. */
export const platformItemsBase: NavItem[] = platformItems

/** Optional label shown next to MNKY LABZ group (e.g. "Command center"). Empty string hides badge. */
export const labGroupBadge = "Command center"
