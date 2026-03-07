"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, Users, Package, Server, MessageSquare } from "lucide-react";
import { useDashboardContext } from "@/components/dashboard-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { StackRequestForm } from "@/components/stack-request-form";

export function DashboardPageContent() {
  const {
    tenants,
    activeTeam,
    appInstancesByTenant,
    isPlatformAdmin,
  } = useDashboardContext();

  const orgCount = tenants.length;
  const provisionsCount = Object.values(appInstancesByTenant).reduce(
    (acc, inst) => acc + (inst.flowise ? 1 : 0) + (inst.n8n ? 1 : 0),
    0
  );

  const selectedTenant = activeTeam?.type === "org" ? activeTeam.tenant : null;
  const currentInstances = selectedTenant
    ? appInstancesByTenant[selectedTenant.id]
    : null;
  const flowiseUrl = currentInstances?.flowise;
  const n8nUrl = currentInstances?.n8n;

  const tableData = React.useMemo(() => {
    const rows: { id: number; header: string; type: string; status: string; target: string; limit: string; reviewer: string; url?: string }[] = [];
    let id = 1;
    for (const tenant of tenants) {
      const inst = appInstancesByTenant[tenant.id];
      if (inst?.flowise) {
        rows.push({
          id: id++,
          header: tenant.name,
          type: "Flowise",
          status: "Active",
          target: "",
          limit: "",
          reviewer: "",
          url: inst.flowise,
        });
      }
      if (inst?.n8n) {
        rows.push({
          id: id++,
          header: tenant.name,
          type: "n8n",
          status: "Active",
          target: "",
          limit: "",
          reviewer: "",
          url: inst.n8n,
        });
      }
    }
    return rows;
  }, [tenants, appInstancesByTenant]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <IntroSection
            flowiseUrl={flowiseUrl}
            n8nUrl={n8nUrl}
            hasOrgs={orgCount > 0}
            isPlatformAdmin={isPlatformAdmin}
            selectedTenant={selectedTenant}
          />
          {selectedTenant && (
            <OrgOverviewSection
              tenantName={selectedTenant.name}
              flowiseUrl={flowiseUrl}
              n8nUrl={n8nUrl}
            />
          )}
          <SectionCards
            organizationsCount={orgCount}
            provisionsCount={provisionsCount}
            flowiseUrl={flowiseUrl}
            n8nUrl={n8nUrl}
            showProxmox={isPlatformAdmin}
          />
          <div className="px-4 lg:px-6">
            <StackRequestForm />
          </div>
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <div className="px-4 lg:px-6">
            <div className="main-glass-panel-card main-float rounded-xl border-0 overflow-hidden p-4 lg:p-6">
              <DataTable
                data={tableData}
                variant="dashboard"
                title="Provisions"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntroSection({
  flowiseUrl,
  n8nUrl,
  hasOrgs,
  isPlatformAdmin,
  selectedTenant,
}: {
  flowiseUrl?: string;
  n8nUrl?: string;
  hasOrgs: boolean;
  isPlatformAdmin: boolean;
  selectedTenant: { id: string; slug: string; name: string } | null;
}) {
  return (
    <section className="main-glass-panel main-float rounded-xl border-0 px-4 py-6 md:px-6 md:py-8">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        Organization overview
      </h2>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        {selectedTenant
          ? `Reviewing ${selectedTenant.name}. Use the sidebar to switch organizations and review members, provisions, and deployments.`
          : "Select an org from the sidebar to review its members, provisions, and deployments."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!hasOrgs && (
          <Button asChild size="sm">
            <Link href="/onboarding">Create organization</Link>
          </Button>
        )}
        {flowiseUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={flowiseUrl} target="_blank" rel="noopener noreferrer">
              Open Flowise
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        {n8nUrl && (
          <Button asChild variant="outline" size="sm">
            <a href={n8nUrl} target="_blank" rel="noopener noreferrer">
              Open n8n
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        {isPlatformAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/proxmox">
              Open Proxmox
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}

function OrgOverviewSection({
  tenantName,
  flowiseUrl,
  n8nUrl,
}: {
  tenantName: string;
  flowiseUrl?: string;
  n8nUrl?: string;
}) {
  return (
    <div className="px-4 lg:px-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Reviewing organization</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="main-glass-panel-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
            <CardDescription>Team and roles for this org</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage in Backoffice or invite via org settings.
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/admin">Backoffice</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Provisions
            </CardTitle>
            <CardDescription>Stack subscriptions and app instances</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {flowiseUrl || n8nUrl
                ? "Flowise and n8n configured for this org."
                : "No app instances configured yet."}
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/admin">Manage instances</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              Deployments
            </CardTitle>
            <CardDescription>Full-stack and VM provisioning</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View stack requests and Proxmox deployments below.
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/dashboard/proxmox">Proxmox</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </CardTitle>
            <CardDescription>Notifications and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity and messages for {tenantName}.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
