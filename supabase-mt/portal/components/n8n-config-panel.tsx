"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { toast } from "sonner";
import { Workflow, Play, Key, Loader2 } from "lucide-react";

const N8N_PROXY = "/api/backoffice/n8n";

function useN8nApi(instanceId: string | null) {
  const get = useCallback(
    async <T,>(path: string): Promise<T> => {
      if (!instanceId) throw new Error("No instance selected");
      const url = `${N8N_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
      return res.json() as Promise<T>;
    },
    [instanceId]
  );

  const del = useCallback(
    async (path: string): Promise<void> => {
      if (!instanceId) throw new Error("No instance selected");
      const url = `${N8N_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
    },
    [instanceId]
  );

  const post = useCallback(
    async <T,>(path: string, body: unknown): Promise<T> => {
      if (!instanceId) throw new Error("No instance selected");
      const url = `${N8N_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
      return res.json() as Promise<T>;
    },
    [instanceId]
  );

  return useMemo(() => ({ get, del, post }), [get, del, post]);
}

type N8nWorkflow = { id: string; name?: string; active?: boolean; updatedAt?: string };
type N8nExecution = { id: string; finished?: boolean; workflowId?: string; startedAt?: string };

function WorkflowsTab({ instanceId }: { instanceId: string }) {
  const api = useN8nApi(instanceId);
  const [list, setList] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<{ data?: N8nWorkflow[] }>("workflows")
      .then((res) => {
        const data = res && "data" in res ? (res as { data?: N8nWorkflow[] }).data : res;
        setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async (id: string) => {
    try {
      await api.del(`workflows/${id}`);
      toast.success("Workflow deleted");
      fetchList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{list.length} workflow(s)</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No workflows. Create them in n8n UI.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name ?? row.id}</TableCell>
                <TableCell>{row.active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.updatedAt ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(row.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ExecutionsTab({ instanceId }: { instanceId: string }) {
  const api = useN8nApi(instanceId);
  const [list, setList] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ data?: N8nExecution[] }>("executions")
      .then((res) => {
        const data = res && "data" in res ? (res as { data?: N8nExecution[] }).data : res;
        setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [instanceId, api]);

  if (loading) return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{list.length} execution(s). List may be limited by n8n API.</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No executions.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead>Workflow ID</TableHead>
              <TableHead>Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.slice(0, 50).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.id.slice(0, 8)}…</TableCell>
                <TableCell>{row.finished ? "Yes" : "No"}</TableCell>
                <TableCell className="font-mono text-xs">{row.workflowId?.slice(0, 8) ?? "—"}…</TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.startedAt ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function CredentialsTab({ instanceId }: { instanceId: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Credentials are managed in the n8n UI. API support for listing/updating credentials may be limited. Instance ID: <code className="rounded bg-muted px-1">{instanceId.slice(0, 8)}…</code>
    </p>
  );
}

function N8nOverview({ instanceId }: { instanceId: string }) {
  const api = useN8nApi(instanceId);
  const [counts, setCounts] = useState<{ workflows: number; executions: number } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ data?: unknown[] }>("workflows").then((r) => (Array.isArray(r?.data) ? r.data.length : 0)).catch(() => 0),
      api.get<{ data?: unknown[] }>("executions").then((r) => (Array.isArray(r?.data) ? r.data.length : 0)).catch(() => 0),
    ]).then(([workflows, executions]) => setCounts({ workflows, executions }));
  }, [instanceId, api]);

  if (!counts) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-2xl font-semibold tabular-nums">{counts.workflows}</div>
        <div className="text-xs text-muted-foreground">Workflows</div>
      </div>
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-2xl font-semibold tabular-nums">{counts.executions}</div>
        <div className="text-xs text-muted-foreground">Executions (recent)</div>
      </div>
    </div>
  );
}

export function N8nConfigPanel() {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  if (!instanceId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">Select an instance from the Admin → App instances table, or open Configure on an n8n instance.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Instance:</span>
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{instanceId.slice(0, 8)}…</code>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">Change</Link>
        </Button>
      </div>
      <N8nOverview instanceId={instanceId} />
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" /> Workflows
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Play className="h-4 w-4" /> Executions
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" /> Credentials
          </TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="mt-4">
          <WorkflowsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="executions" className="mt-4">
          <ExecutionsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="credentials" className="mt-4">
          <CredentialsTab instanceId={instanceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
