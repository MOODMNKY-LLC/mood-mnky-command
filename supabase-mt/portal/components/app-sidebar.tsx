"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChartIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ServerIcon,
  SettingsIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useDashboardContext } from "@/components/dashboard-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {
    user,
    profile,
    tenants,
    isPlatformAdmin,
    activeTeam,
    appInstancesByTenant,
  } = useDashboardContext();

  const sidebarUser = React.useMemo(
    () => ({
      name: profile?.displayName || user?.fullName || "User",
      email: user?.email ?? "",
      avatar: profile?.avatarUrl || user?.avatarUrl || "",
    }),
    [user, profile]
  );

  const { navMain, documents, navSecondary } = React.useMemo(() => {
    const baseSecondary: { title: string; url: string; icon: LucideIcon }[] = [
      { title: "Settings", url: "/profile", icon: SettingsIcon },
      { title: "Get Help", url: "#", icon: HelpCircleIcon },
    ];

    if (activeTeam?.type === "platform") {
      return {
        navMain: [
          { title: "Backoffice", url: "/admin", icon: DatabaseIcon },
          { title: "Settings", url: "/profile", icon: SettingsIcon },
        ] as { title: string; url: string; icon: LucideIcon }[],
        documents: [] as { name: string; url: string; icon: LucideIcon }[],
        navSecondary: baseSecondary,
      };
    }

    if (activeTeam?.type === "proxmox") {
      return {
        navMain: [
          { title: "Proxmox overview", url: "/dashboard/proxmox", icon: ServerIcon },
          { title: "Cluster", url: "/dashboard/proxmox/cluster", icon: FolderIcon },
          { title: "Nodes", url: "/dashboard/proxmox/nodes", icon: BarChartIcon },
          { title: "VMs & LXCs", url: "/dashboard/proxmox/vms", icon: DatabaseIcon },
          { title: "Storage", url: "/dashboard/proxmox/storage", icon: FolderIcon },
          { title: "Settings", url: "/profile", icon: SettingsIcon },
        ] as { title: string; url: string; icon: LucideIcon }[],
        documents: [] as { name: string; url: string; icon: LucideIcon }[],
        navSecondary: baseSecondary,
      };
    }

    const tenantId = activeTeam?.type === "org" ? activeTeam.tenant.id : null;
    const instances = tenantId ? appInstancesByTenant[tenantId] : null;

    const main: { title: string; url: string; icon: LucideIcon }[] = [
      { title: "Home", url: "/dashboard", icon: LayoutDashboardIcon },
      { title: "Infra", url: "/dashboard", icon: FolderIcon },
      { title: "Provisions", url: "/dashboard", icon: BarChartIcon },
    ];

    if (instances?.flowise) {
      main.push({ title: "Flowise", url: instances.flowise, icon: WorkflowIcon });
    }
    if (instances?.n8n) {
      main.push({ title: "n8n", url: instances.n8n, icon: WorkflowIcon });
    }

    main.push(
      { title: "Team", url: "/dashboard", icon: UsersIcon },
      { title: "Settings", url: "/profile", icon: SettingsIcon }
    );

    const docs: { name: string; url: string; icon: LucideIcon }[] = [];
    if (instances?.flowise) docs.push({ name: "Flowise", url: instances.flowise, icon: WorkflowIcon });
    if (instances?.n8n) docs.push({ name: "n8n", url: instances.n8n, icon: WorkflowIcon });
    docs.push({ name: "Docs", url: "https://docs.moodmnky.com", icon: FileTextIcon });

    return {
      navMain: main,
      documents: docs,
      navSecondary: baseSecondary,
    };
  }, [activeTeam, appInstancesByTenant]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {documents.length > 0 && <NavDocuments items={documents} />}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
