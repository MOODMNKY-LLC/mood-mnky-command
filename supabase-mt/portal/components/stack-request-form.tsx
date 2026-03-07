"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { offerings } from "@/lib/copy/offerings";

const PACKAGES = [
  { value: "core", label: offerings.packageNames.core },
  { value: "agent", label: offerings.packageNames.agent },
  { value: "agent-gpu-nvidia", label: offerings.packageNames["agent-gpu-nvidia"] },
  { value: "agent-gpu-amd", label: offerings.packageNames["agent-gpu-amd"] },
  { value: "supabase", label: offerings.packageNames.supabase },
] as const;

type TenantOption = { id: string; name: string; slug: string };

export function StackRequestForm() {
  const [adminTenants, setAdminTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [packageVal, setPackageVal] = useState<string>("core");
  const [specCpu, setSpecCpu] = useState(2);
  const [specRamMb, setSpecRamMb] = useState(4096);
  const [specDiskGb, setSpecDiskGb] = useState(50);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      supabase
        .from("tenant_members")
        .select("tenant_id, role, tenants(id, name, slug)")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .then(({ data }) => {
          setLoading(false);
          const tenants: TenantOption[] = [];
          const seen = new Set<string>();
          for (const m of data ?? []) {
            const raw = m as { tenants?: { id: string; name: string | null; slug: string } | { id: string; name: string | null; slug: string }[] };
            const t = Array.isArray(raw.tenants) ? raw.tenants[0] : raw.tenants;
            if (t && !seen.has(t.id)) {
              seen.add(t.id);
              tenants.push({ id: t.id, name: t.name ?? t.slug, slug: t.slug });
            }
          }
          setAdminTenants(tenants);
          if (tenants.length > 0 && !tenantId) setTenantId(tenants[0].id);
        });
    });
  }, [tenantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Select an organization.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/provisioning/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          package: packageVal,
          spec_cpu: specCpu,
          spec_ram_mb: specRamMb,
          spec_disk_gb: specDiskGb,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.message ?? "Request failed.");
        return;
      }
      toast.success("Stack subscription requested. Platform admin will provision when ready.");
      setPackageVal("core");
      setSpecCpu(2);
      setSpecRamMb(4096);
      setSpecDiskGb(50);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card className="main-glass-panel-card main-float">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (adminTenants.length === 0) {
    return (
      <Card className="main-glass-panel-card main-float">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Request full stack
          </CardTitle>
          <CardDescription>
            Only organization owners and admins can request full MOOD MNKY DevOps/Agent stack provisioning.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="main-glass-panel-card main-float">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Request full stack
        </CardTitle>
        <CardDescription>
          Request the full MOOD MNKY DevOps or Agent stack for your organization. Platform admin will provision on a homelab VM/LXC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="stack-tenant">Organization</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger id="stack-tenant" className="w-full max-w-xs">
                <SelectValue placeholder="Select org" />
              </SelectTrigger>
              <SelectContent>
                {adminTenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stack-package">Package</Label>
            <Select value={packageVal} onValueChange={(v) => setPackageVal(v)}>
              <SelectTrigger id="stack-package" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PACKAGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stack-cpu">CPU (vCPU)</Label>
              <Input
                id="stack-cpu"
                type="number"
                min={1}
                max={32}
                value={specCpu}
                onChange={(e) => setSpecCpu(Number(e.target.value) || 2)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stack-ram">RAM (MB)</Label>
              <Input
                id="stack-ram"
                type="number"
                min={512}
                max={131072}
                value={specRamMb}
                onChange={(e) => setSpecRamMb(Number(e.target.value) || 4096)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stack-disk">Disk (GB)</Label>
              <Input
                id="stack-disk"
                type="number"
                min={10}
                max={2000}
                value={specDiskGb}
                onChange={(e) => setSpecDiskGb(Number(e.target.value) || 50)}
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Request stack"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
