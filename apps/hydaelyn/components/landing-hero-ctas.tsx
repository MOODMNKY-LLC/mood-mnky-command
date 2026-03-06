"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useHydaelynUser } from "@/components/hydaelyn-user-context";

export function LandingHeroCtas() {
  const user = useHydaelynUser();
  const [discordLoading, setDiscordLoading] = useState(false);

  const handleSignInWithDiscord = async () => {
    setDiscordLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/dashboard`
        : "/auth/callback?next=/dashboard";
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
  };

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
      {!user ? (
        <>
          <Button
            size="lg"
            onClick={handleSignInWithDiscord}
            disabled={discordLoading}
            className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-8 py-3 text-base font-medium"
          >
            {discordLoading ? "Redirecting…" : "Sign in with Discord"}
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/signin" className="px-8 py-3 text-base font-medium">
              Sign in with email
            </Link>
          </Button>
        </>
      ) : (
        <>
          <Button size="lg" asChild>
            <Link href="/dashboard" className="px-8 py-3 text-base font-medium">
              Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/fflogs/authorize?intent=link" className="px-8 py-3 text-base font-medium">
              Link FFLogs account
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
