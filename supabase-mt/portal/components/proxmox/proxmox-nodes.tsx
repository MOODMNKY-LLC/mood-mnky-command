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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Box, AlertCircle } from "lucide-react";
import { useProxmoxApi } from "./use-proxmox-api";
import {
  type PveNodes,
  type PveNodeStatus,
  formatBytes,
  formatUptime,
} from "@/lib/proxmox-api";

export function ProxmoxNodes() {
  const api = useProxmoxApi();
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<PveNodes["data"] | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, PveNodeStatus["data"]>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    api
      .get<PveNodes>("nodes")
      .catch(() => ({ data: [] }))
      .then((n) => {
        const nodeList = (n as PveNodes).data ?? [];
        setNodes(nodeList);
        const nodeNames = nodeList.map((x) => x.node).filter(Boolean) as string[];
        return Promise.all(
          nodeNames.map((node) =>
            api
              .get<PveNodeStatus>(`nodes/${node}/status`)
              .catch(() => ({ data: null }))
              .then((st) => ({ node, status: (st as PveNodeStatus).data }))
          )
        );
      })
      .then((perNode) => {
        const statuses: Record<string, PveNodeStatus["data"]> = {};
        perNode.forEach(({ node, status }) => {
          statuses[node] = status ?? undefined;
        });
        setNodeStatuses(statuses);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const nodeList = nodes ?? [];

  if (loading && nodeList.length === 0) {
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
          <Box className="h-6 w-6" />
          Nodes
        </h2>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      <Card className="main-glass-panel-card main-float rounded-xl border-0 overflow-hidden">
        <CardHeader>
          <CardTitle>Cluster nodes</CardTitle>
          <CardDescription>Status, CPU, memory, disk, uptime</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Disk</TableHead>
                <TableHead>Uptime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nodeList.map((node) => {
                const st = nodeStatuses[node.node ?? ""] ?? node;
                const memUsed = node.mem ?? (st as { mem?: number })?.mem ?? 0;
                const memMax = node.maxmem ?? (st as { total?: number })?.total ?? 0;
                const diskUsed = node.disk ?? 0;
                const diskMax = node.maxdisk ?? 0;
                return (
                  <TableRow key={node.node}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/proxmox/nodes/${node.node ?? ""}`}
                        className="text-primary hover:underline"
                      >
                        {node.node ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={node.status === "online" ? "default" : "secondary"}>
                        {node.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {node.maxcpu != null ? `${node.cpu ?? 0} / ${node.maxcpu}` : "—"}
                    </TableCell>
                    <TableCell>
                      {memMax ? `${formatBytes(memUsed)} / ${formatBytes(memMax)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {diskMax ? `${formatBytes(diskUsed)} / ${formatBytes(diskMax)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {node.uptime != null ? formatUptime(node.uptime) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
