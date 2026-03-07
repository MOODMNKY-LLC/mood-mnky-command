import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NextcloudConfigPanel } from "@/components/nextcloud-config-panel";

export default async function AdminNextcloudPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Nextcloud (MNKY CLOUD) configuration</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        View users, server capabilities, and installed apps for the selected Nextcloud instance (OCS API).
      </p>
      <div className="mt-6">
        <NextcloudConfigPanel />
      </div>
    </div>
  );
}
