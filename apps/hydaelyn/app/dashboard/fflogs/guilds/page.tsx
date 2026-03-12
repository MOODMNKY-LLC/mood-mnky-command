import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FflogsGuildsClient } from "./fflogs-guilds-client";

export default async function DashboardFflogsGuildsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin?redirect=/dashboard/fflogs/guilds");

  const fflogsConfigured =
    !!process.env.FFLOGS_CLIENT_ID || process.env.NEXT_PUBLIC_FFLOGS_ENABLED === "true";
  const { data: fflogsRow } = await supabase
    .from("user_fflogs_tokens")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  const fflogsLinked = !!fflogsRow;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FflogsGuildsClient
        fflogsLinked={fflogsLinked}
        fflogsConfigured={fflogsConfigured}
      />
    </div>
  );
}
