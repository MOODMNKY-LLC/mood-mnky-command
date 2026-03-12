"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FolderOpen,
  Server,
  HardDrive,
  ChevronRight,
  ChevronDown,
  Box,
  Database,
} from "lucide-react";
import { useProxmoxApi } from "./use-proxmox-api";
import type {
  PveClusterStatus,
  PveClusterResources,
  PveClusterResource,
} from "@/lib/proxmox-api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type NodeInfo = {
  node: string;
  vms: { vmid: number; name: string; type: "qemu" | "lxc" }[];
  storage: { name: string }[];
};

function buildTree(
  clusterStatus: PveClusterStatus["data"] | undefined,
  resources: PveClusterResource[] | null
): { datacenterName: string; nodes: NodeInfo[] } {
  const name = clusterStatus?.[0]?.name ?? "Datacenter";
  const datacenterName = name ? `Datacenter ${name}` : "Datacenter";

  const byNode = new Map<string, NodeInfo>();
  if (!resources) {
    return { datacenterName, nodes: [] };
  }
  for (const r of resources) {
    const node = r.node ?? "";
    if (!node) continue;
    if (!byNode.has(node)) {
      byNode.set(node, { node, vms: [], storage: [] });
    }
    const info = byNode.get(node)!;
    if (r.type === "qemu" || r.type === "lxc") {
      info.vms.push({
        vmid: r.vmid ?? 0,
        name: r.name ?? `VM ${r.vmid}`,
        type: r.type,
      });
    } else if (r.type === "storage") {
      info.storage.push({ name: r.name ?? r.id ?? "—" });
    }
  }
  const nodes = Array.from(byNode.entries())
    .map(([, info]) => ({
      ...info,
      vms: info.vms.sort((a, b) => a.vmid - b.vmid),
    }))
    .sort((a, b) => a.node.localeCompare(b.node));
  return { datacenterName, nodes };
}

export function ProxmoxServerView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedNode = searchParams.get("node") ?? null;
  const api = useProxmoxApi();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datacenterName, setDatacenterName] = useState("");
  const [nodes, setNodes] = useState<NodeInfo[]>([]);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    Promise.all([
      api.get<PveClusterStatus>("cluster/status"),
      api.get<PveClusterResources>("cluster/resources").catch(() => ({ data: [] })),
    ])
      .then(([cs, cr]) => {
        const data = (cr as PveClusterResources).data ?? [];
        const { datacenterName: dc, nodes: n } = buildTree(
          (cs as PveClusterStatus).data ?? undefined,
          data
        );
        setDatacenterName(dc);
        setNodes(n);
        if (n.length > 0 && expanded.size === 0) {
          setExpanded(new Set(n.map((x) => x.node)));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (node: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  };

  const filteredNodes = search.trim()
    ? nodes.filter(
        (n) =>
          n.node.toLowerCase().includes(search.toLowerCase()) ||
          n.vms.some(
            (v) =>
              v.name.toLowerCase().includes(search.toLowerCase()) ||
              String(v.vmid).includes(search)
          )
      )
    : nodes;

  const isOverview = pathname === "/dashboard/proxmox" || pathname === "/dashboard/proxmox/";

  return (
    <div className="flex h-full flex-col border-r border-border/50 bg-muted/20">
      <div className="shrink-0 border-b border-border/50 p-2">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Server View</p>
        <Input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs"
          aria-label="Search nodes and VMs"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        )}
        {error && (
          <div className="space-y-2" role="alert">
            <p className="text-xs text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load}>
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && (
          <nav className="space-y-0.5 text-sm" aria-label="Proxmox server tree">
            <div className="flex items-center gap-1 px-2 py-1 font-medium text-muted-foreground">
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{datacenterName}</span>
            </div>
            {filteredNodes.map((info) => {
              const isExp = expanded.has(info.node);
              const isSelected = isOverview && selectedNode === info.node;
              return (
                <div key={info.node} className="ml-0">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggle(info.node)}
                      className="flex h-6 w-5 shrink-0 items-center justify-center rounded hover:bg-muted"
                      aria-expanded={isExp}
                      aria-label={isExp ? "Collapse node" : "Expand node"}
                    >
                      {isExp ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <Link
                      href={isOverview ? `/dashboard/proxmox?node=${encodeURIComponent(info.node)}` : `/dashboard/proxmox/nodes/${encodeURIComponent(info.node)}`}
                      className={cn(
                        "flex flex-1 items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-muted",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Server className="h-4 w-4 shrink-0" />
                      <span className="truncate">{info.node}</span>
                    </Link>
                  </div>
                  {isExp && (
                    <div className="ml-5 border-l border-border/50 pl-1">
                      {info.vms.map((vm) => (
                        <Link
                          key={`${info.node}-${vm.vmid}`}
                          href={`/dashboard/proxmox?node=${encodeURIComponent(info.node)}`}
                          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {vm.type === "qemu" ? (
                            <Box className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Database className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate">
                            {vm.vmid} ({vm.name})
                          </span>
                        </Link>
                      ))}
                      {info.storage.map((s) => (
                        <div
                          key={`${info.node}-${s.name}`}
                          className="flex items-center gap-1.5 px-2 py-0.5 text-muted-foreground"
                        >
                          <HardDrive className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{s.name} ({info.node})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="mt-4 border-t border-border/50 pt-2">
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                System
              </p>
              <Link
                href="/dashboard/proxmox/storage"
                className="flex items-center gap-1.5 rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <HardDrive className="h-4 w-4 shrink-0" />
                Storage
              </Link>
              <a
                href="#"
                className="flex items-center gap-1.5 rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Backups
              </a>
              <a
                href="#"
                className="flex items-center gap-1.5 rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Users
              </a>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
