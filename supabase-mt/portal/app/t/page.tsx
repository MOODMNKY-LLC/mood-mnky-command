import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function TenantHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(id, slug, name)")
    .eq("user_id", user.id);

  const tenants = (memberships ?? []).flatMap((m) => {
    const row = m as { tenants?: { id: string; slug: string; name: string } | { id: string; slug: string; name: string }[] | null };
    const t = row.tenants;
    if (!t) return [];
    return Array.isArray(t) ? t : [t];
  });

  if (tenants.length === 1) {
    redirect(`/t/${tenants[0].slug}`);
  }
  if (tenants.length > 1) {
    redirect(`/t/${tenants[0].slug}`);
  }

  return (
    <div className="main-container py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
      <p className="mt-2 text-muted-foreground">
        You are not a member of any organization yet. Request an invite from your administrator.
      </p>
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
