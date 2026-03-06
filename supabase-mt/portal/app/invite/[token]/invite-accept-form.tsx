"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function InviteAcceptForm({
  token,
  tenantName,
  tenantSlug,
  inviteEmail,
  userEmail,
}: {
  token: string;
  tenantName: string;
  tenantSlug: string;
  inviteEmail: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailMatch = inviteEmail.toLowerCase() === userEmail.toLowerCase();

  async function handleAccept() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to accept invite");
        return;
      }
      router.push(`/t/${tenantSlug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!emailMatch) {
    return (
      <div className="main-container flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
        <Card className="main-glass-panel-card w-full max-w-md">
          <CardHeader>
            <CardTitle>Email mismatch</CardTitle>
            <CardDescription>
              This invite was sent to <strong>{inviteEmail}</strong>. You are signed in as{" "}
              <strong>{userEmail}</strong>. Sign in with the invited email to accept.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/auth/login">Sign in with different account</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="main-container flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
      <Card className="main-glass-panel-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {tenantName}</CardTitle>
          <CardDescription>You&apos;ve been invited to join this organization. Accept to continue.</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAccept();
          }}
        >
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Accepting…" : "Accept invite"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Decline</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
