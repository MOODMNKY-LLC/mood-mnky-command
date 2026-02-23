"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, ChevronRight, Home, FileText } from "lucide-react"
import useSWR from "swr"
import {
  storeItems,
  createAndChatItems,
  integrationsItems,
  verseItemsWithBackoffice,
  platformDataAdminItems,
  platformAutomationItems,
  platformSettingsItems,
  productDataItems,
  productBuilderItems,
  labGroupBadge,
} from "@/lib/sidebar-config"
import { useLabzContext } from "@/components/labz-context-provider"
import { LabzContextSwitcher } from "@/components/labz-context-switcher"

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
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import type { NavItem, NavItemWithChildren } from "@/lib/sidebar-config"

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

function NavItemList({
  pathname,
  items,
  exactRoot,
}: {
  pathname: string
  items: NavItem[]
  exactRoot?: string
}) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={isActive(pathname, item.href, exactRoot != null ? item.href === exactRoot : false)}
            tooltip={item.title}
            className={exactRoot === "/" && item.href === "/" && pathname === "/" ? "bg-sidebar-accent/80" : undefined}
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}

const statsFetcher = (url: string) => fetch(url).then((r) => r.json())

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { contextId } = useLabzContext()
  const [navFilter, setNavFilter] = useState("")
  const { data: stats } = useSWR<{ totalFormulas?: number; totalProducts?: number }>(
    contextId === "lab" ? "/api/dashboard/stats" : null,
    statsFetcher,
    { revalidateOnFocus: false },
  )

  const platformDataOpen = pathname === "/platform" || pathname.startsWith("/platform/tables") || pathname.startsWith("/platform/sql") || pathname.startsWith("/platform/storage") || pathname.startsWith("/members")
  const platformAutoOpen = pathname.startsWith("/platform/funnels") || pathname.startsWith("/platform/flowise") || pathname.startsWith("/platform/storefront") || pathname.startsWith("/platform/services") || pathname.startsWith("/platform/artifacts") || pathname.startsWith("/platform/mnky-mind")
  const platformSettingsOpen = pathname.startsWith("/platform/settings") || pathname.startsWith("/platform/integrations")

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const showLab = contextId === "lab"
  const showStore = contextId === "store"
  const showVerse = contextId === "verse"
  const showPlatform = contextId === "platform"
  const showAiTools = contextId === "ai-tools"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 border-b border-sidebar-border px-2 py-3">
        <LabzContextSwitcher />
        <AnimatedThemeToggler
          className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          aria-label="Toggle theme"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <SidebarInput
              placeholder="Filter nav..."
              value={navFilter}
              onChange={(e) => setNavFilter(e.target.value)}
              className="h-8"
            />
          </SidebarGroupContent>
        </SidebarGroup>
        {showLab && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <span>Product Data</span>
                {labGroupBadge && (
                  <Badge variant="secondary" className="text-[10px] font-normal opacity-90 group-data-[collapsible=icon]:hidden">
                    {labGroupBadge}
                  </Badge>
                )}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {productDataItems.map((item) => {
                    const show = !navFilter || item.title.toLowerCase().includes(navFilter.toLowerCase())
                    if (!show) return null
                    const isDashboard = item.href === "/"
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(pathname, item.href, true)}
                          tooltip={item.title}
                          className={pathname === "/" && item.href === "/" ? "bg-sidebar-accent/80" : undefined}
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {isDashboard && stats?.totalFormulas != null && (
                              <SidebarMenuBadge>{stats.totalFormulas}</SidebarMenuBadge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Product Builder</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {productBuilderItems.filter((item) => !navFilter || item.title.toLowerCase().includes(navFilter.toLowerCase())).map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.title}>
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
            <SidebarGroup>
              <SidebarGroupLabel>Integrations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {integrationsItems.filter((item) => !navFilter || item.title.toLowerCase().includes(navFilter.toLowerCase())).map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.href === "/notion" && (
                        <SidebarMenuAction asChild>
                          <Link href="/notion" aria-label="Sync now">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                            </span>
                          </Link>
                        </SidebarMenuAction>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </>
        )}

        {showAiTools && (
          <>
            <Collapsible defaultOpen className="group/createchat">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Create & Chat
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/createchat:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {createAndChatItems.map((item) =>
                        "children" in item && item.children?.length ? (
                          <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={isGroupActive(pathname, item as NavItemWithChildren)}
                            className="group/sub"
                          >
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                tooltip={item.title}
                                isActive={isGroupActive(pathname, item as NavItemWithChildren)}
                                asChild
                              >
                                <Link href={item.href}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuAction className="data-[state=open]:rotate-90">
                                  <ChevronRight className="h-4 w-4" />
                                  <span className="sr-only">Toggle {item.title}</span>
                                </SidebarMenuAction>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {item.children!.map((child) => (
                                    <SidebarMenuSubItem key={child.href}>
                                      <SidebarMenuSubButton asChild isActive={isActive(pathname, child.href)}>
                                        <Link href={child.href}><span>{child.title}</span></Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuItem>
                          </Collapsible>
                        ) : (
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
                        )
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            <SidebarSeparator />
          </>
        )}

        {showVerse && (
          <>
            <Collapsible defaultOpen className="group/verse">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Verse
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/verse:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {verseItemsWithBackoffice.public.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(pathname, item.href, item.href === "/verse")}
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
                    <SidebarGroupLabel className="text-muted-foreground mt-2 text-xs">Community</SidebarGroupLabel>
                    <SidebarMenu>
                      {verseItemsWithBackoffice.backoffice.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={isActive(pathname, item.href)} tooltip={item.title}>
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
            <SidebarSeparator />
          </>
        )}

        {showStore && (
          <>
            <Collapsible defaultOpen={pathname.startsWith("/store")} className="group/store">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Store
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/store:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {storeItems.map((item) =>
                        item.children ? (
                          <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={isGroupActive(pathname, item)}
                            className="group/sub"
                          >
                            <SidebarMenuItem>
                              <SidebarMenuButton tooltip={item.title} isActive={isGroupActive(pathname, item)} asChild>
                                <Link href={item.href}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuAction className="data-[state=open]:rotate-90">
                                  <ChevronRight className="h-4 w-4" />
                                  <span className="sr-only">Toggle {item.title}</span>
                                </SidebarMenuAction>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {item.children.map((child) => (
                                    <SidebarMenuSubItem key={child.href}>
                                      <SidebarMenuSubButton asChild isActive={isActive(pathname, child.href)}>
                                        <Link href={child.href}><span>{child.title}</span></Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  ))}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuItem>
                          </Collapsible>
                        ) : (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive(pathname, item.href, item.href === "/store")}
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
          </>
        )}

        {showPlatform && (
          <>
            <Collapsible defaultOpen={platformDataOpen} className="group/platform-data">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Data & Admin
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/platform-data:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <NavItemList
                      pathname={pathname}
                      items={platformDataAdminItems}
                      exactRoot="/platform"
                    />
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            <SidebarSeparator />
            <Collapsible defaultOpen={platformAutoOpen} className="group/platform-auto">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Automation & Workflows
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/platform-auto:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <NavItemList pathname={pathname} items={platformAutomationItems} />
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            <SidebarSeparator />
            <Collapsible defaultOpen={platformSettingsOpen} className="group/platform-settings">
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger className="flex w-full items-center">
                    Settings & Integrations
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/platform-settings:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <NavItemList pathname={pathname} items={platformSettingsItems} />
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
            <SidebarSeparator />
          </>
        )}
      </SidebarContent>

      {/* ---- Footer ---- */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Documentation">
              <Link href="/docs">
                <FileText className="h-4 w-4" />
                <span>Docs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="MOOD MNKY home">
              <Link href="/main">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
