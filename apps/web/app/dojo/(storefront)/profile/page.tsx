import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Profile is served from the member hub. Redirect to /dojo/me/profile
 * so bookmarks and auth callbacks work (Option B).
 */
export default async function DojoProfileRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ shopify?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const search = new URLSearchParams();
  if (params.shopify === "linked") search.set("shopify", "linked");
  const qs = search.toString();
  redirect(qs ? `/dojo/me/profile?${qs}` : "/dojo/me/profile");
}
