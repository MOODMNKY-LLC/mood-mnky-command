"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Beaker,
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
  Wallet,
  BarChart3,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Formulas",
    href: "/formulas",
    icon: FlaskConical,
  },
  {
    title: "Fragrance Oils",
    href: "/fragrances",
    icon: Droplets,
  },
  {
    title: "Blending Lab",
    href: "/blending",
    icon: Palette,
  },
  {
    title: "Wicks & Wax",
    href: "/wicks",
    icon: Flame,
  },
  {
    title: "Product Builder",
    href: "/products",
    icon: Package,
  },
  {
    title: "Notion Sync",
    href: "/notion",
    icon: Database,
  },
]

const storeItems = [
  {
    title: "Store Overview",
    href: "/store",
    icon: Store,
  },
  {
    title: "Products",
    href: "/store/products",
    icon: ShoppingCart,
  },
  {
    title: "Collections",
    href: "/store/collections",
    icon: FolderOpen,
  },
  {
    title: "Orders",
    href: "/store/orders",
    icon: ClipboardList,
  },
  {
    title: "Customers",
    href: "/store/customers",
    icon: Users,
  },
  {
    title: "Inventory",
    href: "/store/inventory",
    icon: Warehouse,
  },
  {
    title: "Discounts",
    href: "/store/discounts",
    icon: Tags,
  },
  {
    title: "Marketing",
    href: "/store/marketing",
    icon: Megaphone,
  },
  {
    title: "Content",
    href: "/store/content",
    icon: FileText,
  },
  {
    title: "Finance",
    href: "/store/finance",
    icon: Wallet,
  },
  {
    title: "Analytics",
    href: "/store/analytics",
    icon: BarChart3,
  },
]

const platformItems = [
  {
    title: "Overview",
    href: "/platform",
    icon: Server,
  },
  {
    title: "Table Editor",
    href: "/platform/tables",
    icon: Table2,
  },
  {
    title: "SQL Editor",
    href: "/platform/sql",
    icon: Terminal,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Beaker className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              MOOD MNKY
            </span>
            <span className="text-xs text-muted-foreground">Lab</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
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
        <SidebarGroup>
          <SidebarGroupLabel>Shopify Store</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {storeItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/store"
                        ? pathname === "/store"
                        : pathname.startsWith(item.href)
                    }
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
        <SidebarGroup>
          <SidebarGroupLabel>Supabase</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/platform"
                        ? pathname === "/platform"
                        : pathname.startsWith(item.href)
                    }
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
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
            >
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
