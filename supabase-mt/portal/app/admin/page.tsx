import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";

export default async function AdminPage() {
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
    <div className="main-container py-12">
      <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
      <p className="mt-2 text-muted-foreground">
        Backoffice and config for the portal and Supabase MT project.
      </p>
      <div className="mt-8">
        <AdminDashboardClient />
      </div>
    </div>
  );
}
