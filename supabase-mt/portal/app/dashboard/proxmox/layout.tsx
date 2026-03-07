import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProxmoxLayoutClient } from "@/components/proxmox/proxmox-layout-client";

export default async function ProxmoxLayout({
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
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "platform_admin") {
    redirect("/dashboard");
  }

  return <ProxmoxLayoutClient>{children}</ProxmoxLayoutClient>;
}
