import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { N8nConfigPanel } from "@/components/n8n-config-panel";

export default async function AdminN8nPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">n8n configuration</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage workflows, executions, and credentials for the selected instance.
      </p>
      <div className="mt-6">
        <N8nConfigPanel />
      </div>
    </div>
  );
}
