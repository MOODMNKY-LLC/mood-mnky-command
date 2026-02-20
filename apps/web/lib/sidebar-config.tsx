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
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export interface NavItemWithChildren extends NavItem {
  children?: { title: string; href: string }[]
}

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
]

/** Create & Chat: merged MNKY Chat + Studio for a single collapsible group. */
export const createAndChatItems: NavItem[] = [
  { title: "AI Chat", href: "/chat", icon: MessageSquare },
  { title: "Agents", href: "/chat/agents", icon: Bot },
  { title: "Eleven Labs", href: "/chat/eleven-labs", icon: Mic },
  { title: "Image Studio", href: "/studio", icon: Sparkles },
  { title: "Audio Studio", href: "/studio/audio", icon: Mic },
  { title: "Video Studio", href: "/studio/video", icon: Video },
  { title: "Media Library", href: "/media", icon: ImagePlus },
]

/** @deprecated Use createAndChatItems; kept for backwards compatibility. */
export const mnkyChatItems: NavItem[] = createAndChatItems.slice(0, 3)

/** @deprecated Use createAndChatItems; kept for backwards compatibility. */
export const studioItems: NavItem[] = createAndChatItems.slice(3, 7)

export const verseItems: NavItem[] = [
  { title: "MNKY VERSE", href: "/verse", icon: Globe },
  { title: "Products", href: "/verse/products", icon: Package },
  { title: "Collections", href: "/verse/collections", icon: Tags },
  { title: "Cart", href: "/verse/cart", icon: ShoppingCart },
  { title: "Discord", href: "/platform/discord", icon: MessageSquare },
]

/** MNKY VERSE Backoffice: Manga, XP & Quests, UGC, Discord events (dashboard control panels). */
export const verseBackofficeItems: NavItem[] = [
  { title: "Manga / Issues", href: "/verse-backoffice/manga", icon: BookMarked },
  { title: "XP & Quests", href: "/verse-backoffice/xp", icon: Trophy },
  { title: "UGC Moderation", href: "/verse-backoffice/ugc", icon: ImagePlus },
  { title: "Discord Events", href: "/verse-backoffice/discord-events", icon: Activity },
]

/** Platform (Supabase, funnels, tables, etc.). */
export const platformItems: NavItem[] = [
  { title: "Overview", href: "/platform", icon: Server },
  { title: "Funnels", href: "/platform/funnels", icon: ListFilter },
  { title: "Table Editor", href: "/platform/tables", icon: Table2 },
  { title: "SQL Editor", href: "/platform/sql", icon: Terminal },
  { title: "Storefront Assistant", href: "/platform/storefront-assistant", icon: Bot },
  { title: "Flowise", href: "/platform/flowise", icon: Workflow },
  { title: "Members", href: "/members", icon: Users },
]

/** @deprecated Use platformItems. */
export const platformItemsBase: NavItem[] = platformItems

/** Optional label shown next to MNKY LABZ group (e.g. "Command center"). Empty string hides badge. */
export const labGroupBadge = "Command center"
