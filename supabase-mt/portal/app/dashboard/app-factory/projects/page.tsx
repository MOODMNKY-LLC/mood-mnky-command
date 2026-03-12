import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  getAppFactoryProjects,
  getCoolifyServicesForTenant,
  type CoolifyServiceItem,
} from "@/lib/app-factory/actions";
import { ProjectsTable } from "./projects-table";

export const dynamic = "force-dynamic";

export default async function AppFactoryProjectsPage() {
  const result = await getAppFactoryProjects();
  const projects = result.success ? result.projects : [];

  // Fetch Coolify services (applications) per tenant so we can surface what is deployed in each project.
  const tenantIds = [...new Set(projects.map((p) => p.tenant_id).filter(Boolean))] as string[];
  const servicesByTenantId: Record<string, CoolifyServiceItem[]> = {};
  for (const tenantId of tenantIds) {
    const r = await getCoolifyServicesForTenant(tenantId);
    if (r.success) servicesByTenantId[tenantId] = r.services;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Per-project record with deployment spec, Coolify deployment status, and links to view or delete.
          </p>
        </div>
        <Link
          href="/dashboard/app-factory/launch"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Launch new project
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
          <CardDescription>
            View deployment status, open the live app or Coolify, or delete the Coolify deployment for a project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectsTable
            initialProjects={projects}
            servicesByTenantId={servicesByTenantId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
