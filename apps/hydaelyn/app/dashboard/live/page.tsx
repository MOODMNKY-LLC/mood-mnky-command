import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { LiveContextClient } from "./live-context-client";

export default async function DashboardLivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: sessionsData } = await supabase
    .from("stream_sessions")
    .select("id, name, overlay_token, created_at, source")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });
  const sessions = sessionsData ?? [];

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = process.env.NEXT_PUBLIC_HYDAELYN_URL || (host ? `${proto}://${host}` : "");

  return <LiveContextClient sessions={sessions} baseUrl={baseUrl} />;
}
