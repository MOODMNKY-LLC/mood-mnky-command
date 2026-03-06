"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tenant = { id: string; slug: string; name: string };

export function ProfileForm({
  userId,
  initialDisplayName,
  initialActiveTenantId,
  tenants,
}: {
  userId: string;
  initialDisplayName: string;
  initialActiveTenantId: string | null;
  tenants: Tenant[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(initialActiveTenantId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            display_name: displayName.trim() || null,
            active_tenant_id: activeTenantId || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      if (err) {
        setError(err.message);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="main-glass-panel-card main-float mt-8 max-w-md p-6">
      <form onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">Update your display name and default organization.</p>
        </div>
        <div className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Default organization</Label>
            <Select
              value={activeTenantId ?? "none"}
              onValueChange={(v) => setActiveTenantId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
