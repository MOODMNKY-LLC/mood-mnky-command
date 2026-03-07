"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { HardDrive, AlertCircle, Database, PieChart, ChevronDown, ChevronRight } from "lucide-react";
import { useProxmoxApi } from "./use-proxmox-api";
import {
  type PveNodes,
  type PveNodeStorage,
  type PveStorage,
  type PveStorageContent,
  type PveStorageContentItem,
  formatBytes,
} from "@/lib/proxmox-api";

export function ProxmoxStorage() {
  const api = useProxmoxApi();
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<PveNodes["data"] | null>(null);
  const [nodeStorages, setNodeStorages] = useState<Record<string, PveNodeStorage["data"]>>({});
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
              .get<PveNodeStorage>(`nodes/${node}/storage`)
              .catch(() => ({ data: null }))
              .then((stg) => ({ node, storage: (stg as PveNodeStorage).data }))
          )
        );
      })
      .then((perNode) => {
        const storages: Record<string, PveNodeStorage["data"]> = {};
        perNode.forEach(({ node, storage }) => {
          storages[node] = storage ?? undefined;
        });
        setNodeStorages(storages);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const nodeList = nodes ?? [];

  const storageStats = useMemo(() => {
    let poolCount = 0;
    let totalBytes = 0;
    let usedBytes = 0;
    Object.values(nodeStorages).forEach((arr) => {
      const list = Array.isArray(arr) ? arr : [];
      list.forEach((s) => {
        poolCount += 1;
        if (s.total != null) totalBytes += s.total;
        if (s.used != null) usedBytes += s.used;
      });
    });
    return { poolCount, totalBytes, usedBytes };
  }, [nodeStorages]);

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

  const usedPct =
    storageStats.totalBytes > 0
      ? ((storageStats.usedBytes / storageStats.totalBytes) * 100).toFixed(1)
      : null;

  return (
    <div className="px-4 lg:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl flex items-center gap-2">
          <HardDrive className="h-6 w-6" />
          Storage
        </h2>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Storage pools</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              {storageStats.poolCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all nodes</p>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total capacity</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              {storageStats.totalBytes > 0 ? formatBytes(storageStats.totalBytes) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Sum of all pools</p>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total used</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-muted-foreground" />
              {storageStats.usedBytes > 0 ? formatBytes(storageStats.usedBytes) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all pools</p>
          </CardContent>
        </Card>
        <Card className="main-glass-panel-card border-0">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Used %</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              {usedPct != null ? `${usedPct}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Cluster-wide</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {nodeList.map((node) => {
          const storages = nodeStorages[node.node ?? ""] ?? [];
          const list = Array.isArray(storages) ? storages : [];
          return (
            <Card
              key={node.node}
              className="main-glass-panel-card main-float rounded-xl border-0 overflow-hidden"
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  {node.node} — Storage
                </CardTitle>
                <CardDescription>
                  {list.length} pool{list.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" aria-label="Expand" />
                      <TableHead>Storage</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Avail</TableHead>
                      <TableHead>Used %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((s) => (
                      <StorageRow
                        key={`${node.node}-${s.storage ?? ""}`}
                        nodeName={node.node ?? ""}
                        s={s}
                      />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StorageRow({ nodeName, s }: { nodeName: string; s: PveStorage }) {
  const api = useProxmoxApi();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<PveStorageContentItem[] | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const storageId = s.storage ?? "";

  useEffect(() => {
    if (!expanded || !storageId || !nodeName) return;
    setContentError(null);
    setContentLoading(true);
    api
      .get<PveStorageContent>(`nodes/${encodeURIComponent(nodeName)}/storage/${encodeURIComponent(storageId)}/content`)
      .then((res) => {
        const data = (res as PveStorageContent).data ?? [];
        setContent(Array.isArray(data) ? data : []);
      })
      .catch((err) => setContentError(err instanceof Error ? err.message : String(err)))
      .finally(() => setContentLoading(false));
  }, [api, expanded, nodeName, storageId]);

  const used = s.used ?? 0;
  const total = s.total ?? 0;
  const pct = total > 0 ? ((used / total) * 100).toFixed(1) : null;

  return (
    <>
      <TableRow>
        <TableCell className="w-8 py-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide content" : "Show content"}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{s.storage ?? "—"}</TableCell>
        <TableCell>{s.type ?? "—"}</TableCell>
        <TableCell className="max-w-[200px] truncate" title={s.content ?? undefined}>
          {s.content ?? "—"}
        </TableCell>
        <TableCell>{s.active ? "Yes" : "No"}</TableCell>
        <TableCell>{used > 0 ? formatBytes(used) : "—"}</TableCell>
        <TableCell>{total > 0 ? formatBytes(total) : "—"}</TableCell>
        <TableCell>{s.avail != null ? formatBytes(s.avail) : "—"}</TableCell>
        <TableCell>{pct != null ? `${pct}%` : "—"}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-muted/30 p-0">
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Content: {storageId}
              </p>
              {contentLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {contentError && (
                <p className="text-sm text-destructive">{contentError}</p>
              )}
              {!contentLoading && !contentError && content && content.length === 0 && (
                <p className="text-sm text-muted-foreground">No content</p>
              )}
              {!contentLoading && !contentError && content && content.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Volume</TableHead>
                        <TableHead className="text-xs">Content</TableHead>
                        <TableHead className="text-xs">Format</TableHead>
                        <TableHead className="text-xs">VM/CT</TableHead>
                        <TableHead className="text-xs">Size</TableHead>
                        <TableHead className="text-xs">Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {content.slice(0, 50).map((item, i) => (
                        <TableRow key={item.volid ?? i}>
                          <TableCell className="font-mono text-xs max-w-[220px] truncate" title={item.volid}>
                            {item.volid ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs">{item.content ?? "—"}</TableCell>
                          <TableCell className="text-xs">{item.format ?? "—"}</TableCell>
                          <TableCell className="text-xs">{item.vmid ?? "—"}</TableCell>
                          <TableCell className="text-xs">
                            {item.size != null ? formatBytes(item.size) : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.used != null ? formatBytes(item.used) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {content.length > 50 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing 50 of {content.length} items
                    </p>
                  )}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
