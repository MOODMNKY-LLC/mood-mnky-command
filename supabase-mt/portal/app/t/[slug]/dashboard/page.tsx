import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTenantFromSlug } from "@mnky/mt-supabase";
import { getInstanceForTenantOrEnv } from "@/lib/backoffice-instance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Package, Workflow, ExternalLink } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export default async function TenantDashboardPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await getTenantFromSlug(slug);
  if (!tenant) {
    return (
      <div className="main-container py-12">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [membership, subscriptions, appInstances, flowise, n8n] = await Promise.all([
    supabase
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("tenant_stack_subscriptions")
      .select("id, package, status, spec_cpu, spec_ram_mb, spec_disk_gb, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tenant_app_instances")
      .select("id, app_type, name, base_url")
      .eq("tenant_id", tenant.id),
    getInstanceForTenantOrEnv(tenant.id, "flowise", "default"),
    getInstanceForTenantOrEnv(tenant.id, "n8n", "default"),
  ]);

  const myRole = membership?.data?.role ?? "member";
  const subs = subscriptions?.data ?? [];
  const instances = appInstances?.data ?? [];

  return (
    <div className="main-container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6" />
              {tenant.name}
            </h1>
            <p className="text-muted-foreground mt-1">Organization dashboard · {tenant.slug}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/t/${slug}`}>Back to landing</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="main-glass-panel-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team
              </CardTitle>
              <CardDescription>Your role in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="capitalize">
                {myRole}
              </Badge>
            </CardContent>
          </Card>

          <Card className="main-glass-panel-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stack provisions
              </CardTitle>
              <CardDescription>Full-stack deployment requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {subs.length === 0
                  ? "No stack subscriptions yet."
                  : `${subs.length} subscription(s)`}
              </p>
              {subs.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {subs.slice(0, 3).map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {s.status}
                      </Badge>
                      <span>{s.package}</span>
                    </li>
                  ))}
                  {subs.length > 3 && (
                    <li className="text-muted-foreground">+{subs.length - 3} more</li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="main-glass-panel-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                App instances
              </CardTitle>
              <CardDescription>Configured services for this org</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flowise?.base_url && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={flowise.base_url} target="_blank" rel="noopener noreferrer">
                      Flowise <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
                {n8n?.base_url && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a href={n8n.base_url} target="_blank" rel="noopener noreferrer">
                      n8n <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
                {instances.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {instances.length} instance(s) in catalog
                  </p>
                )}
                {!flowise?.base_url && !n8n?.base_url && instances.length === 0 && (
                  <p className="text-sm text-muted-foreground">No app instances configured.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
