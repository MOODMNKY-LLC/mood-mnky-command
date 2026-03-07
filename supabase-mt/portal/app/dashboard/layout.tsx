import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstanceForTenantOrEnv } from "@/lib/backoffice-instance";
import { DashboardShell } from "@/components/dashboard-shell";
import type { DashboardInitialData, AppInstancesByTenant } from "@/components/dashboard-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, platform_role")
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

  const appInstancesByTenant: AppInstancesByTenant = {};
  for (const tenant of tenants) {
    const [flowise, n8n] = await Promise.all([
      getInstanceForTenantOrEnv(tenant.id, "flowise", "default"),
      getInstanceForTenantOrEnv(tenant.id, "n8n", "default"),
    ]);
    appInstancesByTenant[tenant.id] = {};
    if (flowise?.base_url) appInstancesByTenant[tenant.id].flowise = flowise.base_url;
    if (n8n?.base_url) appInstancesByTenant[tenant.id].n8n = n8n.base_url;
  }

  const isPlatformAdmin = profile?.platform_role === "platform_admin";

  const initialData: DashboardInitialData = {
    user: {
      id: user.id,
      email: user.email ?? undefined,
      fullName: (user.user_metadata as { full_name?: string })?.full_name,
      avatarUrl: (user.user_metadata as { avatar_url?: string })?.avatar_url,
    },
    profile: {
      displayName: profile?.display_name ?? "",
      avatarUrl: profile?.avatar_url ?? null,
    },
    tenants,
    isPlatformAdmin: !!isPlatformAdmin,
    appInstancesByTenant,
  };

  return <DashboardShell initialData={initialData}>{children}</DashboardShell>;
}
