"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useProxmoxApi } from "./use-proxmox-api";
import {
  type PveClusterStatus,
  type PveClusterResources,
  formatBytes,
  formatUptime,
} from "@/lib/proxmox-api";

export function ProxmoxCluster() {
  const api = useProxmoxApi();
  const [error, setError] = useState<string | null>(null);
  const [clusterStatus, setClusterStatus] = useState<PveClusterStatus["data"] | null>(null);
  const [clusterResources, setClusterResources] = useState<PveClusterResources["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      api.get<PveClusterStatus>("cluster/status"),
      api.get<PveClusterResources>("cluster/resources").catch(() => ({ data: [] })),
    ])
      .then(([cs, cr]) => {
        setClusterStatus((cs as PveClusterStatus).data ?? null);
        setClusterResources((cr as PveClusterResources).data ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const resources = clusterResources ?? [];

  if (loading && !clusterStatus) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="main-glass-panel-card border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Proxmox error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={load} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Cluster</h2>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {clusterStatus && clusterStatus.length > 0 && (
        <Card className="main-glass-panel-card main-float rounded-xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Cluster status</CardTitle>
            <CardDescription>Quorum and node count</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Quorum</dt>
                <dd className="font-medium">
                  {clusterStatus[0].quorum != null
                    ? clusterStatus[0].quorum
                      ? "Yes"
                      : "No"
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Nodes</dt>
                <dd className="font-medium">{clusterStatus[0].nodes ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card className="main-glass-panel-card main-float rounded-xl border-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Cluster resources</CardTitle>
          <CardDescription>All cluster resources (nodes, VMs, LXCs, storage)</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Node</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Disk</TableHead>
                <TableHead>Uptime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((r) => (
                <TableRow key={r.id ?? `${r.node}-${r.vmid ?? r.name}`}>
                  <TableCell className="font-medium">
                    {r.type === "node" ? (
                      <Link
                        href={`/dashboard/proxmox/nodes/${r.node ?? ""}`}
                        className="text-primary hover:underline"
                      >
                        {r.node ?? r.name ?? "—"}
                      </Link>
                    ) : (
                      r.name ?? `VM ${r.vmid}` ?? "—"
                    )}
                  </TableCell>
                  <TableCell>{r.type ?? "—"}</TableCell>
                  <TableCell>{r.node ?? "—"}</TableCell>
                  <TableCell>{r.status ?? "—"}</TableCell>
                  <TableCell>
                    {r.maxcpu != null ? `${r.cpu ?? 0} / ${r.maxcpu}` : "—"}
                  </TableCell>
                  <TableCell>
                    {r.maxmem != null ? formatBytes(r.maxmem) : "—"}
                  </TableCell>
                  <TableCell>
                    {r.maxdisk != null ? formatBytes(r.maxdisk) : "—"}
                  </TableCell>
                  <TableCell>{r.uptime != null ? formatUptime(r.uptime) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
