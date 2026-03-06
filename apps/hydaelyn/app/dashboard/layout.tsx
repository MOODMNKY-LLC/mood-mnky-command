import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?redirect=/dashboard");
  }

  const userInfo = {
    name: user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
    avatar: "",
  };

  return (
    <DashboardShell user={userInfo}>
      {children}
    </DashboardShell>
  );
}
