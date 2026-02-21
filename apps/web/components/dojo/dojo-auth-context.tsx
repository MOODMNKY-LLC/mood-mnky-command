import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerseUserProvider } from "@/components/verse/verse-user-context";
import type { VerseUser } from "@/components/verse/verse-storefront-shell";

/**
 * Server component: fetches user, redirects if unauthenticated, provides user to children.
 * Dojo requires auth; no public Dojo paths.
 */
export async function DojoAuthContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let profile: { display_name?: string; role?: string; is_admin?: boolean } | null = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("display_name, role, is_admin")
        .eq("id", user.id)
        .single();
      profile = data;
    } catch {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, role, is_admin")
        .eq("id", user.id)
        .single();
      profile = data;
    }
  } else {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, role, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const isAdmin =
    profile?.role === "admin" || profile?.is_admin === true;

  const userInfo: VerseUser = {
    id: user.id,
    email: user.email ?? undefined,
    displayName: profile?.display_name ?? undefined,
    isAdmin: isAdmin || undefined,
  };

  return <VerseUserProvider user={userInfo}>{children}</VerseUserProvider>;
}
