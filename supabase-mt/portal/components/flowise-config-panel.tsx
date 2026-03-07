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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Bot, Variable, Wrench, Database, Loader2, Eye, EyeOff, Copy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const FLOWISE_PROXY = "/api/backoffice/flowise";

function useFlowiseApi(instanceId: string | null) {
  const get = useCallback(
    async <T,>(path: string): Promise<T> => {
      if (!instanceId) throw new Error("No instance selected");
      const url = `${FLOWISE_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
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
      const url = `${FLOWISE_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
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
      const url = `${FLOWISE_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
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

  const put = useCallback(
    async <T,>(path: string, body: unknown): Promise<T> => {
      if (!instanceId) throw new Error("No instance selected");
      const url = `${FLOWISE_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
      const res = await fetch(url, {
        method: "PUT",
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

  return useMemo(() => ({ get, del, post, put }), [get, del, post, put]);
}

type Chatflow = { id: string; name?: string; deployed?: boolean; updatedDate?: string };
type Assistant = { id: string; name?: string; updatedDate?: string };
type VariableRow = { id: string; name?: string; value?: string };

/** Normalize Flowise response: may be array or { data: [] } / { chatflows: [] } etc. */
function normalizeChatflowsList(data: unknown): Chatflow[] {
  if (Array.isArray(data)) return data as Chatflow[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["data", "chatflows", "items", "results"]) {
      if (Array.isArray(o[key])) return o[key] as Chatflow[];
    }
  }
  return [];
}

function ChatflowsTab({ instanceId }: { instanceId: string }) {
  const api = useFlowiseApi(instanceId);
  const [list, setList] = useState<Chatflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(() => {
    setLoading(true);
    let cancelled = false;
    api
      .get<unknown>("chatflows")
      .then((data) => {
        if (!cancelled) setList(normalizeChatflowsList(data));
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(e.message);
          setList([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    const cleanup = fetchList();
    return () => {
      cleanup?.();
    };
  }, [fetchList]);

  const handleDelete = async (id: string) => {
    try {
      await api.del(`chatflows/${id}`);
      toast.success("Chatflow deleted");
      fetchList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setSubmitting(true);
    try {
      await api.post("chatflows", { name: createName.trim(), flowData: {} });
      toast.success("Chatflow created");
      setCreateOpen(false);
      setCreateName("");
      fetchList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{list.length} chatflow(s)</p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>Add chatflow</Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chatflows. Create one to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Deployed</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name ?? row.id}</TableCell>
                <TableCell>{row.deployed ? "Yes" : "No"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.updatedDate ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`https://docs.flowiseai.com/api-reference/chatflows`} target="_blank" rel="noopener noreferrer">API</a>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(row.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New chatflow</DialogTitle>
            <DialogDescription>Create a chatflow via the Flowise API. You can configure it in Flowise UI.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-2 py-4">
              <Label htmlFor="chatflow-name">Name</Label>
              <Input id="chatflow-name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="My chatflow" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssistantsTab({ instanceId }: { instanceId: string }) {
  const api = useFlowiseApi(instanceId);
  const [list, setList] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<Assistant[]>("assistants")
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDelete = async (id: string) => {
    try {
      await api.del(`assistants/${id}`);
      toast.success("Assistant deleted");
      fetchList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{list.length} assistant(s)</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No assistants. Create them in Flowise UI or via API.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name ?? row.id}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.updatedDate ?? "—"}</TableCell>
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

const MASK = "••••••••";

function MaskedValueCell({ id, value }: { id: string; value: string | undefined }) {
  const [visible, setVisible] = useState(false);
  const str = value ?? "—";
  const display = visible ? str : (str === "—" ? "—" : MASK);
  const copy = () => {
    if (str !== "—") {
      navigator.clipboard.writeText(str);
      toast.success("Copied to clipboard");
    }
  };
  return (
    <div className="flex items-center gap-1 max-w-[280px]">
      <code className="text-xs font-mono truncate flex-1 bg-muted px-1.5 py-0.5 rounded min-w-0">
        {display}
      </code>
      {str !== "—" && (
        <>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label={visible ? "Hide" : "Show"} onClick={() => setVisible((v) => !v)}>
            {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" aria-label="Copy to clipboard" onClick={copy}>
            <Copy className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

function VariablesTab({ instanceId }: { instanceId: string }) {
  const api = useFlowiseApi(instanceId);
  const [list, setList] = useState<VariableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<VariableRow[]>("variables")
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [instanceId, api]);

  if (loading) return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{list.length} variable(s). Values hidden until shown; copy notifies on success.</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No variables.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name ?? row.id}</TableCell>
                <TableCell>
                  <MaskedValueCell id={row.id} value={row.value} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ToolsTab({ instanceId }: { instanceId: string }) {
  const api = useFlowiseApi(instanceId);
  const [list, setList] = useState<{ id?: string; name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ id?: string; name?: string }[]>("tools")
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [instanceId, api]);

  if (loading) return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{list.length} tool(s). Manage in Flowise UI.</p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tools.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row, i) => (
              <TableRow key={row.id ?? i}>
                <TableCell>{row.name ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{row.id ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function DocumentStoreTab({ instanceId }: { instanceId: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Document store endpoints are available via the Flowise API. Use the Flowise UI or direct API calls for full CRUD.
      Instance ID: <code className="rounded bg-muted px-1">{instanceId.slice(0, 8)}…</code>
    </p>
  );
}

function FlowiseOverview({ instanceId }: { instanceId: string }) {
  const api = useFlowiseApi(instanceId);
  const [counts, setCounts] = useState<{ chatflows: number; assistants: number; variables: number; tools: number } | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<unknown>("chatflows").then((d) => normalizeChatflowsList(d).length).catch(() => 0),
      api.get<unknown>("assistants").then((d) => {
        if (Array.isArray(d)) return d.length;
        const o = d as Record<string, unknown>;
        for (const key of ["data", "assistants", "items"]) {
          if (Array.isArray(o[key])) return (o[key] as unknown[]).length;
        }
        return 0;
      }).catch(() => 0),
      api.get<unknown>("variables").then((d) => (Array.isArray(d) ? d.length : 0)).catch(() => 0),
      api.get<unknown>("tools").then((d) => (Array.isArray(d) ? d.length : 0)).catch(() => 0),
    ]).then(([chatflows, assistants, variables, tools]) =>
      setCounts({ chatflows, assistants, variables, tools })
    );
  }, [instanceId, api]);

  if (!counts) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-2xl font-semibold tabular-nums">{counts.chatflows}</div>
        <div className="text-xs text-muted-foreground">Chatflows</div>
      </div>
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-2xl font-semibold tabular-nums">{counts.assistants}</div>
        <div className="text-xs text-muted-foreground">Assistants</div>
      </div>
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-2xl font-semibold tabular-nums">{counts.variables}</div>
        <div className="text-xs text-muted-foreground">Variables</div>
      </div>
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="text-2xl font-semibold tabular-nums">{counts.tools}</div>
        <div className="text-xs text-muted-foreground">Tools</div>
      </div>
    </div>
  );
}

export function FlowiseConfigPanel() {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  if (!instanceId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">Select an instance from the Admin → App instances table, or open Configure on a Flowise instance.</p>
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
      <FlowiseOverview instanceId={instanceId} />
      <Tabs defaultValue="chatflows" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chatflows" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Chatflows
          </TabsTrigger>
          <TabsTrigger value="assistants" className="flex items-center gap-2">
            <Bot className="h-4 w-4" /> Assistants
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Variable className="h-4 w-4" /> Variables
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Tools
          </TabsTrigger>
          <TabsTrigger value="documentstore" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Document Store
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chatflows" className="mt-4">
          <ChatflowsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="assistants" className="mt-4">
          <AssistantsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="variables" className="mt-4">
          <VariablesTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="tools" className="mt-4">
          <ToolsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="documentstore" className="mt-4">
          <DocumentStoreTab instanceId={instanceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
