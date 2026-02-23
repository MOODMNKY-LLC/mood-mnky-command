"use client";

import * as React from "react";
import Link from "next/link";
import { Server } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { DojoMusicPlayer } from "@/components/dojo/dojo-music-player";
import { DojoNavMain } from "@/components/dojo/dojo-nav-main";
import { DojoNavProjects } from "@/components/dojo/dojo-nav-projects";
import { DojoSidebarFooter } from "@/components/dojo/dojo-sidebar-footer";
import { DojoTeamSwitcher } from "@/components/dojo/dojo-team-switcher";
import { useDojoContext } from "@/components/dojo/dojo-context-provider";
import { useVerseUser } from "@/components/verse/verse-user-context";
import {
  getDojoNavGroupsForContext,
  getDojoQuickAccessForContext,
} from "@/lib/dojo-sidebar-config";
import { useMounted } from "@/lib/use-mounted";

export function DojoSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const mounted = useMounted();
  const user = useVerseUser();
  const { contextId } = useDojoContext();
  const navGroups = getDojoNavGroupsForContext(contextId);
  const quickAccessItems = getDojoQuickAccessForContext(contextId);
  const isAdmin = user?.isAdmin === true;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 border-b border-sidebar-border px-2 py-3">
        {mounted ? (
          <DojoTeamSwitcher />
        ) : (
          <div className="flex flex-1 items-center gap-2 overflow-hidden rounded-lg px-2 py-1.5 text-sm font-medium">
            <span className="truncate">Dojo</span>
          </div>
        )}
        <AnimatedThemeToggler
          className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          aria-label="Toggle theme"
        />
      </SidebarHeader>

      <SidebarContent>
        {mounted ? (
          <>
            <DojoNavMain groups={navGroups} />
            {isAdmin ? (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Lab">
                      <Link href="/platform">
                        <Server className="h-4 w-4" />
                        <span>Lab</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            ) : null}
            <SidebarSeparator />
            <DojoNavProjects projects={quickAccessItems} />
          </>
        ) : (
          <div className="px-2 py-4 text-muted-foreground text-xs">Loading…</div>
        )}
      </SidebarContent>

      <SidebarGroup className="shrink-0 border-t border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Now playing</SidebarGroupLabel>
        <DojoMusicPlayer />
      </SidebarGroup>

      <SidebarFooter className="border-t border-sidebar-border">
        {mounted ? <DojoSidebarFooter /> : <div className="h-10" />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
