"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, AlertCircle } from "lucide-react";
import {
  useProxmoxApi } from "./use-proxmox-api";
import type { PveVersion, PveClusterStatus, PveClusterResources } from "@/lib/proxmox-api";
import { ProxmoxNodeSummary } from "./proxmox-node-summary";

export type ProxmoxOverviewProps = { selectedNode?: string | null };

export function ProxmoxOverview({ selectedNode = null }: ProxmoxOverviewProps) {
  if (selectedNode) {
    return <ProxmoxNodeSummary node={selectedNode} />;
  }
  const api = useProxmoxApi();
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<PveVersion["data"] | null>(null);
  const [clusterStatus, setClusterStatus] = useState<PveClusterStatus["data"] | null>(null);
  const [clusterResources, setClusterResources] = useState<PveClusterResources["data"] | null>(null);
  const [nodes, setNodes] = useState<{ node?: string }[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      api.get<PveVersion>("version"),
      api.get<PveClusterStatus>("cluster/status"),
      api.get<PveClusterResources>("cluster/resources").catch(() => ({ data: [] })),
      api.get<{ data?: { node?: string }[] }>("nodes").catch(() => ({ data: [] })),
    ])
      .then(([v, cs, cr, n]) => {
        setVersion((v as PveVersion).data ?? null);
        setClusterStatus((cs as PveClusterStatus).data ?? null);
        setClusterResources((cr as PveClusterResources).data ?? null);
        setNodes((n as { data?: { node?: string }[] }).data ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const vmsCount =
    (clusterResources ?? []).filter((r) => r.type === "qemu" || r.type === "lxc").length;
  const nodeCount = nodes?.length ?? 0;

  if (loading && !version) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
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
      <section className="main-glass-panel main-float rounded-xl border-0 px-4 py-6 md:px-6 md:py-8">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl flex items-center gap-2">
          <Server className="h-6 w-6" />
          Proxmox overview
        </h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Cluster summary. Use the links above for cluster, nodes, VMs & LXCs, and storage.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">Backoffice</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="main-glass-panel-card main-float rounded-xl border-0 shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs">Version</CardDescription>
            <CardTitle className="text-lg">
              {version?.release ?? "—"}{" "}
              {version?.repoid ? `(${version.repoid.slice(0, 8)})` : ""}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="main-glass-panel-card main-float rounded-xl border-0 shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs">Quorum</CardDescription>
            <CardTitle className="text-lg">
              {clusterStatus?.[0]?.quorum != null
                ? clusterStatus[0].quorum
                  ? "Yes"
                  : "No"
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="main-glass-panel-card main-float rounded-xl border-0 shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs">Nodes</CardDescription>
            <CardTitle className="text-lg tabular-nums">{nodeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="main-glass-panel-card main-float rounded-xl border-0 shadow-sm">
          <CardHeader className="p-3 pb-1">
            <CardDescription className="text-xs">VMs / LXCs</CardDescription>
            <CardTitle className="text-lg tabular-nums">{vmsCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
