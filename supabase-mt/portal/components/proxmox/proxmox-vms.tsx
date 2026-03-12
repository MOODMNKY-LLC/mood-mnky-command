"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, AlertCircle, Server, Container, Box } from "lucide-react";
import { useProxmoxApi } from "./use-proxmox-api";
import {
  type PveClusterResources,
  type PveClusterResource,
  formatBytes,
  formatUptime,
  formatCpuPct,
} from "@/lib/proxmox-api";

type FilterType = "all" | "qemu" | "lxc";

export function ProxmoxVms() {
  const api = useProxmoxApi();
  const [error, setError] = useState<string | null>(null);
  const [clusterResources, setClusterResources] = useState<PveClusterResources["data"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    api
      .get<PveClusterResources>("cluster/resources")
      .catch(() => ({ data: [] }))
      .then((cr) => {
        setClusterResources((cr as PveClusterResources).data ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const allVms = useMemo(
    () => (clusterResources ?? []).filter((r) => r.type === "qemu" || r.type === "lxc"),
    [clusterResources]
  );

  const vms = useMemo(() => {
    if (filterType === "all") return allVms;
    return allVms.filter((r) => r.type === filterType);
  }, [allVms, filterType]);

  const stats = useMemo(() => {
    const running = allVms.filter((r) => r.status === "running").length;
    const stopped = allVms.filter((r) => r.status === "stopped").length;
    const templates = allVms.filter((r) => r.template === 1).length;
    return { total: allVms.length, running, stopped, templates };
  }, [allVms]);

  if (loading && vms.length === 0) {
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
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl flex items-center gap-2">
          <Cpu className="h-6 w-6" />
          VMs & LXCs
        </h2>
        <div className="flex items-center gap-2">
          {(["all", "qemu", "lxc"] as const).map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterType(t)}
              className="capitalize"
            >
              {t === "all" ? "All" : t === "qemu" ? "VMs" : "LXCs"}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Box className="h-5 w-5 text-muted-foreground" />
              {stats.total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">VMs + containers</p>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Running</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-green-600 dark:text-green-400">
              <Server className="h-5 w-5" />
              {stats.running}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Stopped</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-muted-foreground">
              <Server className="h-5 w-5" />
              {stats.stopped}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Not running</p>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Templates</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Container className="h-5 w-5 text-muted-foreground" />
              {stats.templates}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Clone-only</p>
          </CardContent>
        </Card>
      </div>

      <Card className="main-glass-panel-card main-float rounded-xl border-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Cluster VMs and containers</CardTitle>
          <CardDescription>
            QEMU VMs and LXC containers · showing {vms.length} of {stats.total}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Node</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU use</TableHead>
                <TableHead>Cores</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Disk</TableHead>
                <TableHead>Net In</TableHead>
                <TableHead>Net Out</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Template</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vms.map((vm) => (
                <VmRow key={vm.id ?? `${vm.node}-${vm.vmid}`} vm={vm} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function VmRow({ vm }: { vm: PveClusterResource }) {
  const memUsed = vm.mem ?? 0;
  const memMax = vm.maxmem ?? 0;
  const memPct = memMax > 0 ? ((memUsed / memMax) * 100).toFixed(1) : null;
  const diskUsed = vm.disk ?? 0;
  const diskMax = vm.maxdisk ?? 0;
  const diskPct = diskMax > 0 ? ((diskUsed / diskMax) * 100).toFixed(1) : null;
  const isTemplate = vm.template === 1;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          href={`/dashboard/proxmox/nodes/${vm.node ?? ""}`}
          className="text-primary hover:underline"
        >
          {vm.name ?? `VM ${vm.vmid}` ?? "—"}
        </Link>
      </TableCell>
      <TableCell className="font-mono text-muted-foreground">{vm.vmid ?? "—"}</TableCell>
      <TableCell>
        <Badge variant="outline">{vm.type ?? "—"}</Badge>
      </TableCell>
      <TableCell>{vm.node ?? "—"}</TableCell>
      <TableCell>
        <Badge
          variant={
            vm.status === "running"
              ? "default"
              : vm.status === "stopped"
                ? "secondary"
                : "outline"
          }
        >
          {vm.status ?? "—"}
        </Badge>
      </TableCell>
      <TableCell>
        {vm.status === "running" && vm.cpu != null
          ? formatCpuPct(vm.cpu)
          : "—"}
      </TableCell>
      <TableCell>{vm.maxcpu != null ? `${vm.maxcpu}` : "—"}</TableCell>
      <TableCell>
        {memMax > 0 ? (
          <span title={`${formatBytes(memUsed)} / ${formatBytes(memMax)}`}>
            {formatBytes(memUsed)} {memPct != null && `(${memPct}%)`}
          </span>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>
        {diskMax > 0 ? (
          <span title={`${formatBytes(diskUsed)} / ${formatBytes(diskMax)}`}>
            {formatBytes(diskUsed)} {diskPct != null && `(${diskPct}%)`}
          </span>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {vm.status === "running" && vm.netin != null && vm.netin > 0
          ? formatBytes(vm.netin)
          : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {vm.status === "running" && vm.netout != null && vm.netout > 0
          ? formatBytes(vm.netout)
          : "—"}
      </TableCell>
      <TableCell>
        {vm.uptime != null && vm.status === "running"
          ? formatUptime(vm.uptime)
          : "—"}
      </TableCell>
      <TableCell>
        {isTemplate ? (
          <Badge variant="secondary" className="text-xs">Template</Badge>
        ) : (
          "—"
        )}
      </TableCell>
    </TableRow>
  );
}
