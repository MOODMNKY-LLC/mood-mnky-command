"use client";

import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Radio, Database, ChevronsUpDown } from "lucide-react";
import {
  CONTEXT_LABELS,
  CONTEXT_SEGMENTS,
  getContextFromPathname,
  type DashboardContext,
} from "@/lib/dashboard-context";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CONTEXTS: Exclude<DashboardContext, null>[] = ["fflogs", "live", "act"];

const contextIcons = {
  fflogs: BarChart3,
  live: Radio,
  act: Database,
};

export function TeamSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const current = getContextFromPathname(pathname);
  const label = current ? CONTEXT_LABELS[current] : "Select context";
  const IconComponent = current ? contextIcons[current] : ChevronsUpDown;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <IconComponent className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{label}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {current ? "Switch context" : "FFLogs · Live · ACT"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            {CONTEXTS.map((ctx) => {
              const CtxIcon = contextIcons[ctx];
              const isActive = current === ctx;
              return (
                <DropdownMenuItem
                  key={ctx}
                  onClick={() => router.push(`/dashboard/${CONTEXT_SEGMENTS[ctx]}`)}
                  className={cn(isActive && "bg-accent")}
                >
                  <CtxIcon className="size-4" />
                  {CONTEXT_LABELS[ctx]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
