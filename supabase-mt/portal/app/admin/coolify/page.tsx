import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoolifyConfigPanel } from "@/components/coolify-config-panel";

export default async function AdminCoolifyPage() {
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

  return (
    <div className="main-container py-8">
      <h1 className="text-2xl font-bold tracking-tight">Coolify configuration</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage servers, projects, and deployments for the selected Coolify instance.
      </p>
      <div className="mt-6">
        <CoolifyConfigPanel />
      </div>
    </div>
  );
}
