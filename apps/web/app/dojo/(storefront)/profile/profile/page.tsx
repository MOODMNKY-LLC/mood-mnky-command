import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Verse profile is now served from the Dojo hub. Redirect to /dojo/profile
 * so bookmarks and auth callbacks still work.
 */
export default async function VerseProfilePage({
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
  redirect(qs ? `/dojo/profile?${qs}` : "/dojo/profile");
}
