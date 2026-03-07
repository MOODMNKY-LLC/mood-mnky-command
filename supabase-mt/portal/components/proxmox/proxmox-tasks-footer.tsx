"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProxmoxApi } from "./use-proxmox-api";
import type {
  PveClusterTasks,
  PveClusterLog,
  PveClusterTask,
  PveClusterLogEntry,
} from "@/lib/proxmox-api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Parse Proxmox UPID or use starttime/endtime if present. Format: UPID:node:pid:pstart:starttime_hex:type:id:user */
function formatTaskTime(ts: number | undefined, upid: string | undefined): string {
  if (ts != null && ts > 0) {
    const d = new Date(ts * 1000);
    return d.toLocaleString();
  }
  if (upid) {
    const parts = upid.split(":");
    if (parts.length >= 5) {
      const hex = parts[4];
      const sec = parseInt(hex, 16);
      if (!isNaN(sec)) return new Date(sec * 1000).toLocaleString();
    }
  }
  return "—";
}

function taskStatusOk(status: string | undefined): boolean {
  if (!status) return true;
  const s = status.toLowerCase();
  return s === "ok" || s === "running" || s === "stopped" || s === "unknown";
}

export function ProxmoxTasksFooter() {
  const api = useProxmoxApi();
  const [tasks, setTasks] = useState<PveClusterTask[]>([]);
  const [log, setLog] = useState<PveClusterLogEntry[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingLog, setLoadingLog] = useState(true);
  const [errorTasks, setErrorTasks] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<string | null>(null);

  const loadTasks = useCallback(() => {
    setErrorTasks(null);
    setLoadingTasks(true);
    api
      .get<PveClusterTasks>("cluster/tasks")
      .then((r) => setTasks((r as PveClusterTasks).data ?? []))
      .catch((e) => setErrorTasks(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingTasks(false));
  }, [api]);

  const loadLog = useCallback(() => {
    setErrorLog(null);
    setLoadingLog(true);
    api
      .get<PveClusterLog>("cluster/log")
      .then((r) => setLog((r as PveClusterLog).data ?? []))
      .catch((e) => setErrorLog(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingLog(false));
  }, [api]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  return (
    <div className="mt-4 border-t border-border/50 bg-muted/20 px-4 py-3">
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-2 h-9">
          <TabsTrigger value="tasks" className="text-xs">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="log" className="text-xs">
            Cluster log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-0">
          <div className="max-h-[220px] overflow-y-auto rounded-md border border-border/50">
            {loadingTasks && (
              <div className="p-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="mt-2 h-6 w-full" />
                <Skeleton className="mt-2 h-6 w-4/5" />
              </div>
            )}
            {errorTasks && (
              <p className="p-3 text-sm text-destructive" role="alert">
                {errorTasks}
              </p>
            )}
            {!loadingTasks && !errorTasks && (
              <Table aria-label="Cluster tasks">
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-[140px]">Start time</TableHead>
                    <TableHead className="w-[140px]">End time</TableHead>
                    <TableHead className="w-[100px]">Node</TableHead>
                    <TableHead className="w-[100px]">User</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.slice(0, 50).map((t, i) => (
                    <TableRow
                      key={t.upid ?? i}
                      className={cn(
                        "text-xs",
                        !taskStatusOk(t.status) && "bg-destructive/10"
                      )}
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {formatTaskTime(t.starttime, t.upid)}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {formatTaskTime(t.endtime, undefined)}
                      </TableCell>
                      <TableCell>{t.node ?? "—"}</TableCell>
                      <TableCell>{t.user ?? "—"}</TableCell>
                      <TableCell>
                        {t.type ?? "—"}
                        {t.id != null ? ` ${t.id}` : ""}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            !taskStatusOk(t.status) && "text-destructive font-medium"
                          )}
                        >
                          {t.status ?? "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        <TabsContent value="log" className="mt-0">
          <div className="max-h-[220px] overflow-y-auto rounded-md border border-border/50">
            {loadingLog && (
              <div className="p-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="mt-2 h-6 w-full" />
              </div>
            )}
            {errorLog && (
              <p className="p-3 text-sm text-destructive" role="alert">
                {errorLog}
              </p>
            )}
            {!loadingLog && !errorLog && (
              <Table aria-label="Cluster log">
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-[140px]">Time</TableHead>
                    <TableHead className="w-[80px]">Node</TableHead>
                    <TableHead className="w-[80px]">User</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(log ?? []).slice(0, 100).map((entry, i) => (
                    <TableRow
                      key={entry.n ?? i}
                      className={cn(
                        "text-xs",
                        entry.pri != null && entry.pri <= 3 && "bg-destructive/10"
                      )}
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {entry.t != null
                          ? new Date(
                              (typeof entry.t === "number" ? entry.t : Number(entry.t)) * 1000
                            ).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>{entry.node ?? "—"}</TableCell>
                      <TableCell>{entry.user ?? "—"}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {entry.msg ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
