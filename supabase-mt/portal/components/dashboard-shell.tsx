"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardProvider, type DashboardInitialData } from "@/components/dashboard-context";

type DashboardShellProps = {
  initialData: DashboardInitialData;
  children: React.ReactNode;
};

export function DashboardShell({ initialData, children }: DashboardShellProps) {
  return (
    <DashboardProvider initialData={initialData}>
      <SidebarProvider className="dashboard-glass-scope">
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  );
}
