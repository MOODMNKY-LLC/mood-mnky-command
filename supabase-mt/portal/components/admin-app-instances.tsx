"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Settings, Trash2, Eye, EyeOff, Copy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

type TenantRow = { id: string; name: string | null; slug: string | null };
type InstanceRow = {
  id: string;
  tenant_id: string;
  app_type: string;
  name: string | null;
  base_url: string | null;
  created_at: string;
  tenants: TenantRow | TenantRow[] | null;
};

type EnvDefaults = {
  flowise: boolean;
  n8n: boolean;
  minio?: boolean;
  nextcloud?: boolean;
  coolify?: boolean;
  flowise_url?: string;
  n8n_url?: string;
  minio_url?: string;
  nextcloud_url?: string;
  coolify_url?: string;
};

const MASK = "••••••••";

/** Auth-only keys: api key, username/password, access/secret, oauth, etc. Exclude base_url/endpoint. */
function isAuthKey(key: string): boolean {
  return key !== "base_url" && key !== "endpoint" && key !== "message";
}

/** Inline Auth cell: api key, username/password, access_key/secret_key, oauth, etc. Masked with show/copy. */
function InstanceAuthCell({ instanceId }: { instanceId: string }) {
  const [creds, setCreds] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/backoffice/instance-credentials?instanceId=${encodeURIComponent(instanceId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === "object" && "message" in d) return null;
        return d as Record<string, unknown>;
      })
      .then(setCreds)
      .catch(() => setCreds(null))
      .finally(() => setLoading(false));
  }, [instanceId]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const toggleVisible = (key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const entries = creds && typeof creds === "object"
    ? Object.entries(creds).filter(([k, v]) => isAuthKey(k) && v != null && v !== "")
    : [];

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">…</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1.5 max-w-[280px]">
      {entries.map(([key, value]) => {
        const str = String(value);
        const isVisible = visible.has(key);
        return (
          <div key={key} className="flex items-center gap-1 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0 w-16 truncate" title={key}>
              {key.replace(/_/g, " ")}:
            </span>
            <code className="text-xs font-mono truncate flex-1 bg-muted px-1.5 py-0.5 rounded min-w-0">
              {isVisible ? str : MASK}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label={isVisible ? "Hide" : "Show"}
              onClick={() => toggleVisible(key)}
            >
              {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              aria-label="Copy to clipboard"
              onClick={() => copy(str)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export function AdminAppInstances() {
  const [instances, setInstances] = useState<InstanceRow[]>([]);
  const [envDefaults, setEnvDefaults] = useState<EnvDefaults | null>(null);
  const [tenants, setTenants] = useState<{ id: string; name: string | null; slug: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterField, setFilterField] = useState<"tenant" | "app" | "instance" | "baseUrl">("tenant");
  const [filterValue, setFilterValue] = useState("");
  const [form, setForm] = useState({
    tenantId: "",
    appType: "flowise" as "flowise" | "n8n" | "minio" | "nextcloud" | "coolify",
    name: "default",
    baseUrl: "",
    apiKey: "",
    useEnvDefault: false,
  });

  const fetchInstances = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tenant_app_instances")
      .select("id, tenant_id, app_type, name, base_url, created_at, tenants(id, name, slug)")
      .order("tenant_id")
      .order("app_type")
      .order("name");

    if (error) {
      toast.error(error.message);
      setInstances([]);
      return;
    }
    setInstances((data ?? []) as InstanceRow[]);
  }, []);

  const fetchTenants = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .order("name");

    if (error) {
      toast.error(error.message);
      setTenants([]);
      return;
    }
    setTenants(data ?? []);
  }, []);

  const fetchEnvDefaults = useCallback(async () => {
    try {
      const res = await fetch("/api/backoffice/env-defaults");
      if (!res.ok) return;
      const data = (await res.json()) as EnvDefaults;
      setEnvDefaults(data);
    } catch {
      setEnvDefaults(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchInstances(), fetchTenants(), fetchEnvDefaults()]).finally(() =>
      setLoading(false)
    );
  }, [fetchInstances, fetchTenants, fetchEnvDefaults]);

  const matches = useCallback(
    (tenant: string, app: string, instance: string, baseUrl: string) => {
      const q = filterValue.trim().toLowerCase();
      if (!q) return true;
      switch (filterField) {
        case "tenant":
          return tenant.toLowerCase().includes(q);
        case "app":
          return app.toLowerCase().includes(q);
        case "instance":
          return instance.toLowerCase().includes(q);
        case "baseUrl":
          return (baseUrl ?? "").toLowerCase().includes(q);
        default:
          return true;
      }
    },
    [filterField, filterValue]
  );

  const filteredInstances = useMemo(() => {
    return instances.filter((row) => {
      const t = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
      const tenantStr = t?.name ?? t?.slug ?? row.tenant_id ?? "";
      return matches(tenantStr, row.app_type, row.name ?? "default", row.base_url ?? "");
    });
  }, [instances, matches]);

  const showEnvFlowise = envDefaults?.flowise && matches("Platform", "flowise", "default", envDefaults.flowise_url ?? "");
  const showEnvN8n = envDefaults?.n8n && matches("Platform", "n8n", "default", envDefaults.n8n_url ?? "");
  const showEnvMinio = envDefaults?.minio && matches("Platform", "minio", "default", envDefaults.minio_url ?? "");
  const showEnvNextcloud = envDefaults?.nextcloud && matches("Platform", "nextcloud", "default", envDefaults.nextcloud_url ?? "");
  const showEnvCoolify = envDefaults?.coolify && matches("Platform", "coolify", "default", envDefaults.coolify_url ?? "");

  const handleAddInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId) {
      toast.error("Tenant is required.");
      return;
    }
    if (!form.useEnvDefault && !form.baseUrl.trim()) {
      toast.error("Base URL is required unless using platform default.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("tenant_app_instances").insert({
      tenant_id: form.tenantId,
      app_type: form.appType,
      name: form.name.trim() || "default",
      base_url: form.useEnvDefault ? null : form.baseUrl.trim() || null,
      api_key_encrypted: form.useEnvDefault ? null : form.apiKey.trim() || null,
      settings: form.useEnvDefault ? { use_env_default: true } : {},
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Instance added.");
    setAddOpen(false);
    setForm({
      tenantId: "",
      appType: "flowise",
      name: "default",
      baseUrl: "",
      apiKey: "",
      useEnvDefault: false,
    } as typeof form);
    fetchInstances();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("tenant_app_instances").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Instance removed.");
    setDeleteId(null);
    fetchInstances();
  };

  return (
    <>
      <Card className="main-glass-panel-card main-float">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">App instances</CardTitle>
          <CardDescription>
            Granular app services: Flowise, n8n, MinIO (S3), Nextcloud, Coolify. Base URL and Auth inline; each app can be subscribed to independently or as part of the full stack.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : instances.length === 0 && !envDefaults?.flowise && !envDefaults?.n8n && !envDefaults?.minio && !envDefaults?.nextcloud && !envDefaults?.coolify ? (
            <p className="text-sm text-muted-foreground">No instances yet. Add one below.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={filterField} onValueChange={(v) => setFilterField(v as typeof filterField)}>
                  <SelectTrigger className="h-8 w-[130px] font-mono text-xs">
                    <SelectValue placeholder="Filter by…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant" className="font-mono text-xs">Tenant</SelectItem>
                    <SelectItem value="app" className="font-mono text-xs">App</SelectItem>
                    <SelectItem value="instance" className="font-mono text-xs">Instance</SelectItem>
                    <SelectItem value="baseUrl" className="font-mono text-xs">Base URL</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={`Search ${filterField === "baseUrl" ? "base URL" : filterField}…`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="h-8 min-w-[180px] max-w-[280px] font-mono text-xs"
                />
                {filterValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground"
                    onClick={() => setFilterValue("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Instance</TableHead>
                    <TableHead>Base URL</TableHead>
                    <TableHead>Auth</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {showEnvFlowise && (
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell className="capitalize">flowise</TableCell>
                    <TableCell>default</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={envDefaults.flowise_url ?? undefined}>
                      {envDefaults.flowise_url ?? "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <InstanceAuthCell instanceId="env-flowise" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/flowise?instanceId=env-flowise">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {showEnvN8n && (
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell className="capitalize">n8n</TableCell>
                    <TableCell>default</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={envDefaults.n8n_url ?? undefined}>
                      {envDefaults.n8n_url ?? "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <InstanceAuthCell instanceId="env-n8n" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/n8n?instanceId=env-n8n">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {envDefaults?.minio && (
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell className="capitalize">minio</TableCell>
                    <TableCell>default</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={envDefaults.minio_url ?? undefined}>
                      {envDefaults.minio_url ?? "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <InstanceAuthCell instanceId="env-minio" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/minio?instanceId=env-minio">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {showEnvNextcloud && (
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell className="capitalize">nextcloud</TableCell>
                    <TableCell>default</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={envDefaults.nextcloud_url ?? undefined}>
                      {envDefaults.nextcloud_url ?? "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <InstanceAuthCell instanceId="env-nextcloud" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/nextcloud?instanceId=env-nextcloud">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {showEnvCoolify && (
                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell className="capitalize">coolify</TableCell>
                    <TableCell>default</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={envDefaults.coolify_url ?? undefined}>
                      {envDefaults.coolify_url ?? "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <InstanceAuthCell instanceId="env-coolify" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/coolify?instanceId=env-coolify">
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
                {filteredInstances.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {(() => {
                        const t = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
                        return t?.name ?? t?.slug ?? row.tenant_id;
                      })()}
                    </TableCell>
                    <TableCell className="capitalize">{row.app_type}</TableCell>
                    <TableCell>{row.name ?? "default"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={row.base_url ?? undefined}>
                      {row.base_url ?? "—"}
                    </TableCell>
                    <TableCell className="align-top">
                      <InstanceAuthCell instanceId={row.id} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={
                              row.app_type === "flowise"
                                ? `/admin/flowise?instanceId=${row.id}`
                                : row.app_type === "n8n"
                                  ? `/admin/n8n?instanceId=${row.id}`
                                  : row.app_type === "minio"
                                    ? `/admin/minio?instanceId=${row.id}`
                                    : row.app_type === "coolify"
                                      ? `/admin/coolify?instanceId=${row.id}`
                                      : `/admin/nextcloud?instanceId=${row.id}`
                            }
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
              {(
                envDefaults?.flowise ||
                envDefaults?.n8n ||
                envDefaults?.minio ||
                envDefaults?.nextcloud ||
                envDefaults?.coolify ||
                instances.length > 0
              ) &&
                !showEnvFlowise &&
                !showEnvN8n &&
                !showEnvMinio &&
                !showEnvNextcloud &&
                !showEnvCoolify &&
                filteredInstances.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">No instances match the current filters.</p>
                )}
            </>
          )}

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add instance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add app instance</DialogTitle>
                <DialogDescription>
                  Register a Flowise, n8n, MinIO, Nextcloud, or Coolify instance for a tenant. Base URL and optional API key are stored securely.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddInstance}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tenant">Tenant</Label>
                    <Select
                      required
                      value={form.tenantId}
                      onValueChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
                    >
                      <SelectTrigger id="tenant">
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name ?? t.slug ?? t.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="appType">App type</Label>
                    <Select
                      value={form.appType}
                      onValueChange={(v: "flowise" | "n8n" | "minio" | "nextcloud" | "coolify") =>
                        setForm((f) => ({ ...f, appType: v }))
                      }
                    >
                      <SelectTrigger id="appType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flowise">Flowise</SelectItem>
                        <SelectItem value="n8n">n8n</SelectItem>
                        <SelectItem value="minio">MinIO (S3)</SelectItem>
                        <SelectItem value="nextcloud">Nextcloud</SelectItem>
                        <SelectItem value="coolify">Coolify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Instance name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="default"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useEnvDefault"
                      checked={form.useEnvDefault}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, useEnvDefault: checked === true }))
                      }
                    />
                    <Label htmlFor="useEnvDefault" className="text-sm font-normal">
                      Use platform default (from env)
                    </Label>
                  </div>
                  {!form.useEnvDefault && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="baseUrl">Base URL</Label>
                        <Input
                          id="baseUrl"
                          type="url"
                          value={form.baseUrl}
                          onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                          placeholder="https://flowise.example.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="apiKey">API key (optional)</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          autoComplete="off"
                          value={form.apiKey}
                          onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                          placeholder="Stored encrypted; never shown in UI"
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding…" : "Add instance"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove instance?</AlertDialogTitle>
            <AlertDialogDescription>
              This only removes the instance from the portal config. It does not delete the Flowise, n8n, Coolify, or other server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
