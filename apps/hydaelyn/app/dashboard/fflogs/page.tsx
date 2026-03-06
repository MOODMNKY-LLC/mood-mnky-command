import { createClient } from "@/lib/supabase/server";
import { FflogsContextClient } from "./fflogs-context-client";

export default async function DashboardFflogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const fflogsConfigured =
    !!process.env.FFLOGS_CLIENT_ID ||
    process.env.NEXT_PUBLIC_FFLOGS_ENABLED === "true";
  const fflogsEnabled =
    fflogsConfigured || process.env.NODE_ENV === "development";
  const { data: fflogsRow } = await supabase
    .from("user_fflogs_tokens")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  const fflogsLinked = !!fflogsRow;

  return (
    <FflogsContextClient
      fflogsEnabled={fflogsEnabled}
      fflogsConfigured={fflogsConfigured}
      fflogsLinked={fflogsLinked}
    />
  );
}
