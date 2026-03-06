"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvitePage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (t) router.push(`/invite/${encodeURIComponent(t)}`);
  }

  return (
    <div className="main-container flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
      <Card className="main-glass-panel-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept invite</CardTitle>
          <CardDescription>
            Paste your invite token from the email you received, or use the full invite link.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Invite token</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token or paste full URL"
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={!token.trim()}>
              Continue
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/dashboard" className="text-primary underline hover:no-underline">
                Back to dashboard
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
