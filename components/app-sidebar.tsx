"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Droplets,
  LayoutDashboard,
  Package,
  FlaskConical,
  Palette,
  Flame,
  Database,
  LogOut,
  Server,
  Table2,
  Terminal,
  Store,
  ShoppingCart,
  FolderOpen,
  ClipboardList,
  Users,
  Warehouse,
  Tags,
  Megaphone,
  FileText,
  ListFilter,
  Wallet,
  BarChart3,
  ChevronRight,
  Plus,
  ImagePlus,
  FolderArchive,
  Sparkles,
  Video,
  Mic,
  BookOpen,
  MessageSquare,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// ---------------------------------------------------------------------------
// Navigation data
// ---------------------------------------------------------------------------

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

interface NavItemWithChildren extends NavItem {
  children?: { title: string; href: string }[]
}

const labItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Formulas", href: "/formulas", icon: FlaskConical },
  { title: "Fragrance Oils", href: "/fragrances", icon: Droplets },
  { title: "Glossary", href: "/glossary", icon: BookOpen },
  { title: "Blending Lab", href: "/blending", icon: Palette },
  { title: "Wicks & Wax", href: "/wicks", icon: Flame },
  { title: "Product Builder", href: "/products", icon: Package },
]

const storeItems: NavItemWithChildren[] = [
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
  { title: "Finance", href: "/store/finance", icon: Wallet },
]

const mnkyChatItems: NavItem[] = [
  { title: "AI Chat", href: "/chat", icon: MessageSquare },
]

const studioItems: NavItem[] = [
  { title: "Image Studio", href: "/studio", icon: Sparkles },
  { title: "Audio Studio", href: "/studio/audio", icon: Mic },
  { title: "Video Studio", href: "/studio/video", icon: Video },
  { title: "Media Library", href: "/media", icon: ImagePlus },
]

const platformItemsBase: NavItem[] = [
  { title: "Overview", href: "/platform", icon: Server },
  { title: "Funnels", href: "/platform/funnels", icon: ListFilter },
  { title: "Table Editor", href: "/platform/tables", icon: Table2 },
  { title: "SQL Editor", href: "/platform/sql", icon: Terminal },
  { title: "Members", href: "/members", icon: Users },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

function isGroupActive(pathname: string, item: NavItemWithChildren) {
  if (isActive(pathname, item.href, item.href === "/store")) return true
  return item.children?.some((c) => isActive(pathname, c.href)) ?? false
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch("/api/me", { credentials: "include" }).catch(() => null)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      {/* ---- Header ---- */}
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary p-1">
            <img
              src="/mood-mnky-icon.svg"
              alt="MOOD MNKY"
              className="h-full w-full object-contain"
              width={32}
              height={32}
            />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              MOOD MNKY
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Lab
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* ---- Scrollable content ---- */}
      <SidebarContent>
        {/* ======== MNKY Lab ======== */}
        <SidebarGroup>
          <SidebarGroupLabel>MNKY Lab</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {labItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href, item.href === "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ======== Data Sources ======== */}
        <SidebarGroup>
          <SidebarGroupLabel>Data Sources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(pathname, "/notion")}
                  tooltip="Notion Sync"
                >
                  <Link href="/notion">
                    <Database className="h-4 w-4" />
                    <span>Notion Sync</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuAction asChild>
                  <Link href="/notion" aria-label="Sync now">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                    </span>
                  </Link>
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ======== MNKY Chat ======== */}
        <SidebarGroup>
          <SidebarGroupLabel>MNKY Chat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mnkyChatItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ======== Studio ======== */}
        <SidebarGroup>
          <SidebarGroupLabel>Studio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studioItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ======== Shopify Store (collapsible) ======== */}
        <Collapsible defaultOpen className="group/store">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                Shopify Store
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/store:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <SidebarGroupAction asChild>
              <Link href="/store/products" aria-label="Add product">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add product</span>
              </Link>
            </SidebarGroupAction>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {storeItems.map((item) =>
                    item.children ? (
                      /* ---- Collapsible sub-menu ---- */
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={isGroupActive(pathname, item)}
                        className="group/sub"
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            isActive={isGroupActive(pathname, item)}
                          >
                            <Link href={item.href}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuAction className="data-[state=open]:rotate-90">
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">
                                Toggle {item.title}
                              </span>
                            </SidebarMenuAction>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive(pathname, child.href)}
                                  >
                                    <Link href={child.href}>
                                      <span>{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      /* ---- Simple link ---- */
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(
                            pathname,
                            item.href,
                            item.href === "/store"
                          )}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* ======== Supabase (collapsible) ======== */}
        <Collapsible defaultOpen className="group/supa">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                Supabase
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/supa:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platformItemsBase.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(
                          pathname,
                          item.href,
                          item.href === "/platform"
                        )}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      {/* ---- Footer ---- */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
