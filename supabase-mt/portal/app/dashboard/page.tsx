import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(id, slug, name)")
    .eq("user_id", user.id);

  const tenants = (memberships ?? []).flatMap((m) => {
    const t = (m as { tenants?: { id: string; slug: string; name: string } | { id: string; slug: string; name: string }[] | null }).tenants;
    if (!t) return [];
    return Array.isArray(t) ? t : [t];
  });

  return (
    <div className="main-container py-12">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome back. Select an organization to get started.</p>

      {tenants.length === 0 ? (
        <div className="main-glass-panel-card main-float mt-8 p-6">
          <h3 className="text-lg font-semibold">No organizations yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an organization or accept an invite to get started.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/onboarding">Create organization</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((t) => (
            <div key={t.id} className="main-glass-panel-card main-float p-6">
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{t.slug}</p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/t/${t.slug}`}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
          <div className="main-glass-panel-card main-float border-dashed p-6">
            <h3 className="text-lg font-semibold text-muted-foreground">Add organization</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create a new organization or accept an invite.</p>
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/onboarding">Create</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
