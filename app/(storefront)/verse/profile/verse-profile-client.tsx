"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function VerseProfileClient({
  email,
  displayName,
}: {
  email: string;
  displayName?: string;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Profile
        </h1>
        <p className="mt-1 text-sm text-verse-text-muted">
          Account settings and scent preferences (coming soon).
        </p>
      </div>
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text">
            Account
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayName && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Display name
              </span>
              <p className="text-verse-text">{displayName}</p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
              Email
            </span>
            <p className="text-verse-text">{email}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/update-password">Update password</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-verse-text"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
