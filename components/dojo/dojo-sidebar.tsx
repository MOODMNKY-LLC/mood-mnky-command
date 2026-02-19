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

export function DojoSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { contextId } = useDojoContext();
  const navGroups = getDojoNavGroupsForContext(contextId);
  const quickAccessItems = getDojoQuickAccessForContext(contextId);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 border-b border-sidebar-border px-2 py-3">
        <DojoTeamSwitcher />
        <ThemeToggle
          className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          aria-label="Toggle theme"
        />
      </SidebarHeader>

      <SidebarContent>
        <DojoNavMain groups={navGroups} />
        <SidebarSeparator />
        <DojoNavProjects projects={quickAccessItems} />
      </SidebarContent>

      <SidebarGroup className="shrink-0 border-t border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Now playing</SidebarGroupLabel>
        <DojoMusicPlayer />
      </SidebarGroup>

      <SidebarFooter className="border-t border-sidebar-border">
        <DojoSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
