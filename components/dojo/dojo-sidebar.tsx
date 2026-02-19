"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { DojoNavMain } from "@/components/dojo/dojo-nav-main";
import { DojoNavProjects } from "@/components/dojo/dojo-nav-projects";
import { DojoSidebarFooter } from "@/components/dojo/dojo-sidebar-footer";
import { DojoTeamSwitcher } from "@/components/dojo/dojo-team-switcher";
import {
  dojoNavGroups,
  dojoQuickAccessItems,
  dojoTeams,
} from "@/lib/dojo-sidebar-config";

export function DojoSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 border-b border-sidebar-border px-2 py-3">
        <DojoTeamSwitcher teams={dojoTeams} />
        <ThemeToggle
          className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          aria-label="Toggle theme"
        />
      </SidebarHeader>

      <SidebarContent>
        <DojoNavMain groups={dojoNavGroups} />
        <SidebarSeparator />
        <DojoNavProjects projects={dojoQuickAccessItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <DojoSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
