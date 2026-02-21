"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { DojoMusicPlayer } from "@/components/dojo/dojo-music-player";
import { DojoNavMain } from "@/components/dojo/dojo-nav-main";
import { DojoNavProjects } from "@/components/dojo/dojo-nav-projects";
import { DojoSidebarFooter } from "@/components/dojo/dojo-sidebar-footer";
import { DojoTeamSwitcher } from "@/components/dojo/dojo-team-switcher";
import { useDojoContext } from "@/components/dojo/dojo-context-provider";
import {
  getDojoNavGroupsForContext,
  getDojoQuickAccessForContext,
} from "@/lib/dojo-sidebar-config";
import { useMounted } from "@/lib/use-mounted";

export function DojoSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const mounted = useMounted();
  const { contextId } = useDojoContext();
  const navGroups = getDojoNavGroupsForContext(contextId);
  const quickAccessItems = getDojoQuickAccessForContext(contextId);

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
        <ThemeToggle
          className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          aria-label="Toggle theme"
        />
      </SidebarHeader>

      <SidebarContent>
        {mounted ? (
          <>
            <DojoNavMain groups={navGroups} />
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
