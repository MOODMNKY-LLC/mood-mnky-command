"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useDashboardContext } from "@/components/dashboard-context";
import { Button } from "@/components/ui/button";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

export function DashboardPageContent() {
  const {
    tenants,
    activeTeam,
    appInstancesByTenant,
  } = useDashboardContext();

  const orgCount = tenants.length;
  const provisionsCount = Object.values(appInstancesByTenant).reduce(
    (acc, inst) => acc + (inst.flowise ? 1 : 0) + (inst.n8n ? 1 : 0),
    0
  );

  const currentInstances =
    activeTeam?.type === "org"
      ? appInstancesByTenant[activeTeam.tenant.id]
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
          />
          <SectionCards
            organizationsCount={orgCount}
            provisionsCount={provisionsCount}
            flowiseUrl={flowiseUrl}
            n8nUrl={n8nUrl}
          />
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
}: {
  flowiseUrl?: string;
  n8nUrl?: string;
  hasOrgs: boolean;
}) {
  return (
    <section className="main-glass-panel main-float rounded-xl border-0 px-4 py-6 md:px-6 md:py-8">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        Partner dashboard
      </h2>
      <p className="mt-2 text-muted-foreground max-w-2xl">
        Manage your infrastructure and provisions within the MOOD MNKY ecosystem. Use Flowise for AI workflows and n8n for automation.
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
      </div>
    </section>
  );
}
