import { createClient } from "@/lib/supabase/server";
import { createClient as createMTAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { InviteAcceptForm } from "./invite-accept-form";

type Props = { params: Promise<{ token: string }> };

export default async function InviteAcceptPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
  const serviceRoleKey = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return (
      <div className="main-container py-12">
        <p className="text-destructive">MT project not configured.</p>
      </div>
    );
  }

  const admin = createMTAdmin(url, serviceRoleKey);
  const { data: invite, error: inviteErr } = await admin
    .from("tenant_invites")
    .select("id, tenant_id, email, role, expires_at, tenants(slug, name)")
    .eq("token", token)
    .maybeSingle();

  if (inviteErr || !invite || new Date(invite.expires_at) < new Date()) {
    return (
      <div className="main-container flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
        <p className="text-muted-foreground">Invalid or expired invite.</p>
      </div>
    );
  }

  const raw = (invite as { tenants?: { slug: string; name: string } | { slug: string; name: string }[] | null }).tenants;
  const tenant = raw ? (Array.isArray(raw) ? raw[0] : raw) : null;
  if (!tenant) {
    return (
      <div className="main-container py-12">
        <p className="text-destructive">Tenant not found.</p>
      </div>
    );
  }

  if (!user) {
    redirect(`/auth/sign-up?redirect=/invite/${token}`);
  }

  return (
    <InviteAcceptForm
      token={token}
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      inviteEmail={invite.email}
      userEmail={user.email ?? ""}
    />
  );
}
