import { createClient } from "@/lib/supabase/server";
import { HydaelynUserProvider } from "./hydaelyn-user-context";
import type { HydaelynUser } from "./hydaelyn-user-context";

/** Server component: fetches current user and wraps children with HydaelynUserProvider. */
export async function HydaelynAuthContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userInfo: HydaelynUser = null;
  if (user) {
    const { data: fflogsRow } = await supabase
      .from("user_fflogs_tokens")
      .select("profile_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    userInfo = {
      id: user.id,
      email: user.email ?? undefined,
      fflogsLinked: !!fflogsRow,
    };
  }

  return <HydaelynUserProvider user={userInfo}>{children}</HydaelynUserProvider>;
}
