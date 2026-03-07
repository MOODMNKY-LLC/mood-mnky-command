"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  FileText,
  Network,
  Shield,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { useProxmoxApi } from "./use-proxmox-api";
import type { PveNodeStatus } from "@/lib/proxmox-api";
import { formatBytes, formatUptime } from "@/lib/proxmox-api";
import { ProxmoxRrdCharts } from "./proxmox-rrd-charts";
import { cn } from "@/lib/utils";

const subNavItems = [
  { id: "summary", label: "Summary", icon: Activity },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "system", label: "System", icon: Server },
  { id: "network", label: "Network", icon: Network },
  { id: "certificates", label: "Certificates", icon: Shield },
  { id: "disks", label: "Disks", icon: HardDrive },
];

type Props = { node: string };

export function ProxmoxNodeSummary({ node }: Props) {
  const api = useProxmoxApi();
  const [status, setStatus] = useState<PveNodeStatus["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    api
      .get<PveNodeStatus>(`nodes/${encodeURIComponent(node)}/status`)
      .then((r) => setStatus((r as PveNodeStatus).data ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [api, node]);

  useEffect(() => {
    load();
  }, [load]);

  const loadavg = status?.loadavg;
  const loadStr =
    Array.isArray(loadavg) && loadavg.length >= 3
      ? `${Number(loadavg[0]).toFixed(2)}, ${Number(loadavg[1]).toFixed(2)}, ${Number(loadavg[2]).toFixed(2)}`
      : "—";
  const memUsed = status?.mem ?? 0;
  const memTotal = status?.total ?? 0;
  const memPct = memTotal > 0 ? ((memUsed / memTotal) * 100).toFixed(2) : "—";
  const rootfs = status?.rootfs;
  const diskUsed = rootfs?.used ?? 0;
  const diskTotal = rootfs?.total ?? 0;
  const diskPct = diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(2) : "—";

  const cpuInfoStr =
    status?.cpuinfo == null
      ? null
      : typeof status.cpuinfo === "string"
        ? status.cpuinfo
        : (() => {
            const c = status.cpuinfo as Record<string, unknown>;
            const model = c.model ?? "—";
            const cores = c.cores != null ? String(c.cores) : null;
            const sockets = c.sockets != null ? String(c.sockets) : null;
            const mhz = c.mhz != null ? `${c.mhz} MHz` : null;
            const parts = [model, cores, sockets, mhz].filter(Boolean);
            return parts.length > 1 ? parts.join(" · ") : String(model);
          })();

  if (loading && !status) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
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
              Error loading node
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
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Node: {node}
          </h1>
          <Badge variant={status?.status === "online" ? "default" : "secondary"}>
            {status?.status ?? "—"}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Search..."
            className="h-8 w-[140px] text-sm"
            aria-label="Search"
          />
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a
              href="https://pve.proxmox.com/pve-docs/pve-admin-guide.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </Button>
          <Button variant="outline" size="sm" disabled>
            Create VM
          </Button>
          <Button variant="outline" size="sm" disabled>
            Create CT
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a
              href="https://pve.proxmox.com/wiki/Main_Page"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sub-nav */}
        <nav
          className="flex w-40 shrink-0 flex-col gap-0.5 text-sm"
          aria-label="Node sections"
        >
          {subNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-left font-medium transition-colors",
                activeTab === item.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Summary content */}
        <div className="min-w-0 flex-1">
          {activeTab === "summary" && (
            <>
              <section className="main-glass-panel main-float rounded-xl border-0 px-4 py-4 md:px-6">
                <h2 className="text-base font-semibold tracking-tight">
                  {node} (Uptime: {status?.uptime != null ? formatUptime(status.uptime) : "—"})
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">CPU usage</dt>
                    <dd className="text-sm font-medium">—</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Load average</dt>
                    <dd className="text-sm font-medium">{loadStr}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">RAM usage</dt>
                    <dd className="text-sm font-medium">
                      {memTotal > 0
                        ? `${memPct}% (${formatBytes(memUsed)} of ${formatBytes(memTotal)})`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">HD space</dt>
                    <dd className="text-sm font-medium">
                      {diskTotal > 0
                        ? `${diskPct}% (${formatBytes(diskUsed)} of ${formatBytes(diskTotal)})`
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {cpuInfoStr != null && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    CPU: {cpuInfoStr}
                  </p>
                )}
              </section>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium">Performance</h3>
                <ProxmoxRrdCharts node={node} />
              </div>
            </>
          )}
          {activeTab !== "summary" && (
            <Card className="main-glass-panel-card border-0">
              <CardHeader>
                <CardTitle className="text-base">{subNavItems.find((i) => i.id === activeTab)?.label}</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
