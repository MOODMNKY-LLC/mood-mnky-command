import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantFromSlug } from "@mnky/mt-supabase";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function TenantLayout({ children, params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const tenant = await getTenantFromSlug(slug);
  if (!tenant) redirect("/t");

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/t");

  return <>{children}</>;
}
