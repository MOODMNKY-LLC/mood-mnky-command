"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Separator } from "@/components/ui/separator";
import { getContextFromPathname, CONTEXT_LABELS } from "@/lib/dashboard-context";

export function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string; avatar: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const context = getContextFromPathname(pathname);
  const pageTitle = context ? CONTEXT_LABELS[context] : "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeader title={pageTitle} />
        <Separator />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
