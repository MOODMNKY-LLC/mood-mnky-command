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
import { HardDrive, AlertCircle } from "lucide-react";
import { useProxmoxApi } from "./use-proxmox-api";
import {
  type PveNodeStatus,
  type PveNodeStorage,
  formatBytes,
  formatUptime,
} from "@/lib/proxmox-api";

type Props = { node: string };

export function ProxmoxNodeDetail({ node }: Props) {
  const api = useProxmoxApi();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PveNodeStatus["data"] | null>(null);
  const [storage, setStorage] = useState<PveNodeStorage["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      api.get<PveNodeStatus>(`nodes/${node}/status`).catch(() => ({ data: null })),
      api.get<PveNodeStorage>(`nodes/${node}/storage`).catch(() => ({ data: null })),
    ])
      .then(([st, stg]) => {
        setStatus((st as PveNodeStatus).data ?? null);
        setStorage((stg as PveNodeStorage).data ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [api, node]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !status) {
    return (
      <div className="px-4 lg:px-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
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

  const storages = Array.isArray(storage) ? storage : [];

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/proxmox/nodes">← Nodes</Link>
          </Button>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{node}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      <Card className="main-glass-panel-card main-float rounded-xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Node status</CardTitle>
          <CardDescription>Uptime and memory</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={status?.status === "online" ? "default" : "secondary"}>
                  {status?.status ?? "—"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Uptime</dt>
              <dd className="font-medium">
                {status?.uptime != null ? formatUptime(status.uptime) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Memory</dt>
              <dd className="font-medium">
                {status?.total != null
                  ? `${formatBytes(status.mem ?? 0)} / ${formatBytes(status.total)}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="main-glass-panel-card main-float rounded-xl border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2">
          <HardDrive className="h-5 w-5" />
          <CardTitle>Storage</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Storage</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Avail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storages.map((s) => (
                <TableRow key={s.storage}>
                  <TableCell className="font-medium">{s.storage ?? "—"}</TableCell>
                  <TableCell>{s.type ?? "—"}</TableCell>
                  <TableCell>{s.content ?? "—"}</TableCell>
                  <TableCell>{s.active ? "Yes" : "No"}</TableCell>
                  <TableCell>{s.used != null ? formatBytes(s.used) : "—"}</TableCell>
                  <TableCell>{s.total != null ? formatBytes(s.total) : "—"}</TableCell>
                  <TableCell>{s.avail != null ? formatBytes(s.avail) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
