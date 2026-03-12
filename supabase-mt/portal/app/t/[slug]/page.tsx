import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getTenantFromSlug } from "@mnky/mt-supabase";
import { getInstanceForTenantOrEnv } from "@/lib/backoffice-instance";

type Props = { params: Promise<{ slug: string }> };

export default async function TenantPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const tenant = await getTenantFromSlug(slug);
  if (!tenant) {
    return (
      <div className="main-container py-12">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  const flowiseInstance = await getInstanceForTenantOrEnv(tenant.id, "flowise", "default");
  const n8nInstance = await getInstanceForTenantOrEnv(tenant.id, "n8n", "default");

  return (
    <div className="main-container py-12">
      <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
      <p className="mt-2 text-muted-foreground">Organization: {tenant.slug}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {flowiseInstance?.base_url && (
          <div className="main-glass-panel-card main-float rounded-xl border-0 p-6">
            <h3 className="text-lg font-semibold">Flowise</h3>
            <p className="mt-2 text-sm text-muted-foreground">AI workflows and chatflows</p>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <a href={flowiseInstance.base_url} target="_blank" rel="noopener noreferrer">
                  Open Flowise
                </a>
              </Button>
            </div>
          </div>
        )}
        {n8nInstance?.base_url && (
          <div className="main-glass-panel-card main-float rounded-xl border-0 p-6">
            <h3 className="text-lg font-semibold">n8n</h3>
            <p className="mt-2 text-sm text-muted-foreground">Workflow automation</p>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <a href={n8nInstance.base_url} target="_blank" rel="noopener noreferrer">
                  Open n8n
                </a>
              </Button>
            </div>
          </div>
        )}
        {!flowiseInstance?.base_url && !n8nInstance?.base_url && (
          <div className="main-glass-panel-card main-float rounded-xl border-0 p-6">
            <h3 className="text-lg font-semibold">Resources</h3>
            <p className="mt-2 text-sm text-muted-foreground">No app instances configured for this organization yet.</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/t/${slug}/dashboard`}>Go to dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
