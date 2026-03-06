import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, active_tenant_id")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(id, slug, name)")
    .eq("user_id", user.id);

  const tenants = (memberships ?? []).flatMap((m) => {
    const t = (m as { tenants?: { id: string; slug: string; name: string } | { id: string; slug: string; name: string }[] | null }).tenants;
    if (!t) return [];
    return Array.isArray(t) ? t : [t];
  });

  return (
    <div className="main-container py-12">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <p className="mt-2 text-muted-foreground">Manage your account and organization preferences.</p>
      <ProfileForm
        userId={user.id}
        initialDisplayName={profile?.display_name ?? ""}
        initialActiveTenantId={profile?.active_tenant_id ?? null}
        tenants={tenants}
      />
    </div>
  );
}
