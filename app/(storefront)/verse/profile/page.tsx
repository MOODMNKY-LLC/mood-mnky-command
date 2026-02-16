import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerseProfileClient } from "./verse-profile-client";

export default async function VerseProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let profile: { display_name?: string } | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    profile = data;
  } catch {
    // ignore
  }

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <VerseProfileClient
        email={user.email ?? ""}
        displayName={profile?.display_name ?? undefined}
      />
    </div>
  );
}
