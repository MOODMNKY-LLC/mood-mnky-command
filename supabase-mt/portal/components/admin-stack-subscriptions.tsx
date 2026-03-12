"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Server } from "lucide-react";
import { offerings } from "@/lib/copy/offerings";

type TenantRef = { id: string; name: string | null; slug: string | null } | null;
type SubscriptionRow = {
  id: string;
  tenant_id: string;
  package: string;
  spec_cpu: number;
  spec_ram_mb: number;
  spec_disk_gb: number;
  proxmox_node: string | null;
  vm_id: number | null;
  lxc_id: number | null;
  status: string;
  created_at: string;
  tenants: TenantRef | TenantRef[];
};

export function AdminStackSubscriptions() {
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    setFetchError(null);
    supabase
      .from("tenant_stack_subscriptions")
      .select("id, tenant_id, package, spec_cpu, spec_ram_mb, spec_disk_gb, proxmox_node, vm_id, lxc_id, status, created_at, tenants(id, name, slug)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          const msg =
            (error as { message?: string }).message ??
            (typeof error === "object" && "message" in error
              ? String((error as { message: unknown }).message)
              : "Failed to load stack subscriptions");
          const code = (error as { code?: string }).code;
          console.error(
            "tenant_stack_subscriptions",
            msg,
            code ? `(${code})` : "",
            { details: (error as { details?: string }).details }
          );
          setFetchError(msg);
          return;
        }
        setRows((data ?? []) as SubscriptionRow[]);
      });
  }, []);

  const packageLabel = (pkg: string) =>
    (offerings.packageNames as Record<string, string>)[pkg] ?? pkg;

  const tenantDisplay = (r: SubscriptionRow) => {
    const t = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants;
    return t?.name ?? t?.slug ?? r.tenant_id;
  };

  return (
    <Card id="stack-subscriptions" className="main-glass-panel-card main-float">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Stack subscription requests
        </CardTitle>
        <CardDescription>
          Full MOOD MNKY DevOps/Agent stack requests. Run Ansible manually with the subscription id to provision (see provisioning README).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : fetchError ? (
          <p className="text-sm text-destructive">
            {fetchError}
            {fetchError.includes("does not exist") && (
              <span className="block mt-1 text-muted-foreground font-normal">
                Run Supabase migrations (e.g. supabase db push or apply migration 20260307000000_tenant_stack_subscriptions).
              </span>
            )}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No stack subscription requests yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">Tenant</TableHead>
                  <TableHead className="font-mono text-xs">Package</TableHead>
                  <TableHead className="font-mono text-xs">CPU</TableHead>
                  <TableHead className="font-mono text-xs">RAM (MB)</TableHead>
                  <TableHead className="font-mono text-xs">Disk (GB)</TableHead>
                  <TableHead className="font-mono text-xs">Status</TableHead>
                  <TableHead className="font-mono text-xs">VM / LXC</TableHead>
                  <TableHead className="font-mono text-xs">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">
                      {tenantDisplay(r)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{packageLabel(r.package)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.spec_cpu}</TableCell>
                    <TableCell className="font-mono text-xs">{r.spec_ram_mb}</TableCell>
                    <TableCell className="font-mono text-xs">{r.spec_disk_gb}</TableCell>
                    <TableCell className="font-mono text-xs">{r.status}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.vm_id != null ? `VM ${r.vm_id}` : r.lxc_id != null ? `LXC ${r.lxc_id}` : "—"}
                      {r.proxmox_node ? ` @ ${r.proxmox_node}` : ""}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
