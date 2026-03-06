"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function deriveSlugFromName(n: string) {
    return n
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(n: string) {
    setName(n);
    if (!slug || slug === deriveSlugFromName(name)) {
      setSlug(deriveSlugFromName(n));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/create-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create organization");
        return;
      }
      router.push(`/t/${data.tenant.slug}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-container flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
      <Card className="main-glass-panel-card w-full max-w-md">
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
          <CardDescription>
            Set up your organization to get started. You can invite team members later.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Organization name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Inc"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-inc"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs, e.g. /t/acme-inc. Letters, numbers, and hyphens only.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? "Creating…" : "Create organization"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Have an invite?{" "}
              <Link href="/invite" className="text-primary underline hover:no-underline">
                Accept invite
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
