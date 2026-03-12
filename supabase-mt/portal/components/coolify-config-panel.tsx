"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import { Server, FolderGit, Rocket, Loader2, ExternalLink, Box, Database, Layers } from "lucide-react";

const COOLIFY_PROXY = "/api/backoffice/coolify";

type CoolifyServer = {
  id?: number;
  uuid?: string;
  name?: string;
  description?: string;
  ip?: string;
  user?: string;
  port?: number;
  settings?: { is_reachable?: boolean; is_usable?: boolean };
};

type CoolifyProject = { id?: number; uuid?: string; name?: string; description?: string };

type CoolifyApplication = {
  id?: number;
  uuid?: string;
  name?: string;
  description?: string;
  /** API may return string (e.g. "running") or object (e.g. { running: "unknown" }) */
  status?: string | Record<string, unknown>;
  fqdn?: string;
  git_repository?: string;
  git_branch?: string;
  destination_type?: string;
  destination_id?: number;
  created_at?: string;
  updated_at?: string;
};

/** Normalize Coolify application status for display. API may return string (e.g. "running:unknown"), or object (e.g. { running: "unknown" }). */
function formatApplicationStatus(status: CoolifyApplication["status"]): string {
  if (status == null) return "—";
  if (typeof status === "string") {
    const s = status.trim();
    if (!s) return "—";
    if (s.toLowerCase().endsWith(":unknown")) {
      const state = s.slice(0, s.length - ":unknown".length).trim();
      return state ? state.charAt(0).toUpperCase() + state.slice(1).toLowerCase() : "—";
    }
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  if (typeof status === "object" && !Array.isArray(status)) {
    const entries = Object.entries(status);
    if (entries.length === 0) return "—";
    const [[key, value]] = entries;
    const keyLabel = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    const valueStr = value != null && value !== "" ? String(value).trim() : "";
    if (!valueStr || valueStr.toLowerCase() === "unknown") return keyLabel;
    return `${keyLabel} (${valueStr})`;
  }
  return "—";
}

type CoolifyDeployment = {
  id?: number;
  deployment_uuid?: string;
  application_id?: string;
  application_name?: string;
  server_id?: number;
  server_name?: string;
  status?: string;
  deployment_url?: string;
  commit?: string;
  commit_message?: string;
  created_at?: string;
  updated_at?: string;
};

/** Databases and resources: API may return array of objects; schema is flexible. */
type CoolifyDbOrResource = Record<string, unknown>;

function ServersTab({ instanceId }: { instanceId: string }) {
  const [list, setList] = useState<CoolifyServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `${COOLIFY_PROXY}/servers?instanceId=${encodeURIComponent(instanceId)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err: { message?: string }) => Promise.reject(new Error(err?.message ?? res.statusText)));
        }
        return res.json() as Promise<CoolifyServer[]>;
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load servers";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading servers…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error}. Check COOLIFY_API_KEY in .env.local and that the Coolify instance is reachable.
      </p>
    );
  }
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No servers. Add servers in the Coolify UI.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>UUID</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Port</TableHead>
            <TableHead>Reachable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((s) => (
            <TableRow key={s.uuid ?? s.id ?? String(s.name)}>
              <TableCell className="font-medium">{s.name ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={s.uuid}>
                {s.uuid ?? "—"}
              </TableCell>
              <TableCell>{s.ip ?? "—"}</TableCell>
              <TableCell>{s.user ?? "—"}</TableCell>
              <TableCell>{s.port ?? "—"}</TableCell>
              <TableCell>
                {s.settings?.is_reachable != null
                  ? s.settings.is_reachable
                    ? "Yes"
                    : "No"
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProjectsTab({ instanceId }: { instanceId: string }) {
  const [list, setList] = useState<CoolifyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `${COOLIFY_PROXY}/projects?instanceId=${encodeURIComponent(instanceId)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err: { message?: string }) => Promise.reject(new Error(err?.message ?? res.statusText)));
        }
        return res.json() as Promise<CoolifyProject[]>;
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load projects";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error}. The Coolify API may use a different path for projects; check the API reference.
      </p>
    );
  }
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects. Create projects in the Coolify UI.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>UUID</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p) => (
            <TableRow key={p.uuid ?? p.id ?? p.name ?? ""}>
              <TableCell className="font-medium">{p.name ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={p.uuid}>
                {p.uuid ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{p.description ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ApplicationsTab({ instanceId }: { instanceId: string }) {
  const [list, setList] = useState<CoolifyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = `instanceId=${encodeURIComponent(instanceId)}`;

    fetch(`${COOLIFY_PROXY}/applications?${query}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err: { message?: string }) => Promise.reject(new Error(err?.message ?? res.statusText)));
        }
        return res.json() as Promise<CoolifyApplication[]>;
      })
      .then(async (data) => {
        const apps = Array.isArray(data) ? data : [];
        if (cancelled) return;

        if (apps.length === 0) {
          setList([]);
          return;
        }

        setList(apps);

        const uuids = apps.map((a) => a.uuid).filter((u): u is string => Boolean(u?.trim()));
        if (uuids.length === 0) return;

        const detailPromises = uuids.map((uuid) =>
          fetch(`${COOLIFY_PROXY}/applications/${encodeURIComponent(uuid)}?instanceId=${encodeURIComponent(instanceId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        );

        const details = await Promise.all(detailPromises);
        if (cancelled) return;

        const statusByUuid = new Map<string, CoolifyApplication["status"]>();
        details.forEach((d, i) => {
          const uuid = uuids[i];
          if (uuid && d && typeof d === "object" && "status" in d) statusByUuid.set(uuid, (d as CoolifyApplication).status);
        });

        setList((prev) =>
          prev.map((app) => {
            const uuid = app.uuid;
            if (!uuid || !statusByUuid.has(uuid)) return app;
            return { ...app, status: statusByUuid.get(uuid) };
          })
        );
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load applications";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error}. Check the Coolify API and proxy configuration.
      </p>
    );
  }
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No applications. Deploy apps from the Coolify UI.</p>;
  }

  const toAppUrl = (fqdn: string | undefined) => {
    if (!fqdn?.trim()) return null;
    const s = fqdn.trim();
    return s.startsWith("http://") || s.startsWith("https://") ? s : `https://${s}`;
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead title="Domain or URL where the app is served (FQDN)" className="cursor-help">
              Domain
            </TableHead>
            <TableHead>Git</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>UUID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((a) => {
            const appUrl = toAppUrl(a.fqdn);
            return (
            <TableRow key={a.uuid ?? a.id ?? a.name ?? ""}>
              <TableCell className="font-medium">{a.name ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatApplicationStatus(a.status)}</TableCell>
              <TableCell className="font-mono text-xs max-w-[160px] truncate">
                {appUrl ? (
                  <a href={appUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block" title={a.fqdn}>
                    {a.fqdn ?? appUrl}
                  </a>
                ) : (
                  a.fqdn ?? "—"
                )}
              </TableCell>
              <TableCell className="font-mono text-xs max-w-[140px] truncate text-muted-foreground" title={a.git_repository}>{a.git_repository ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{a.git_branch ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={a.uuid}>{a.uuid ?? "—"}</TableCell>
            </TableRow>
          );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function DatabasesTab({ instanceId }: { instanceId: string }) {
  const [list, setList] = useState<CoolifyDbOrResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `${COOLIFY_PROXY}/databases?instanceId=${encodeURIComponent(instanceId)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err: { message?: string }) => Promise.reject(new Error(err?.message ?? res.statusText)));
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : typeof data === "object" && data !== null ? [data] : []);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load databases";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading databases…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error}. Check the Coolify API and proxy configuration.
      </p>
    );
  }
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No databases. Add databases from the Coolify UI.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name / ID</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((db, i) => (
            <TableRow key={(db as { uuid?: string; id?: number }).uuid ?? (db as { id?: number }).id ?? i}>
              <TableCell className="font-mono text-xs">
                {(db as { name?: string }).name ?? (db as { uuid?: string }).uuid ?? (db as { id?: number }).id ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {typeof db === "object" && db !== null
                  ? Object.entries(db)
                      .filter(([k]) => !["name", "uuid", "id"].includes(k))
                      .slice(0, 5)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" · ") || "—"
                  : String(db)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ResourcesTab({ instanceId }: { instanceId: string }) {
  const [list, setList] = useState<CoolifyDbOrResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `${COOLIFY_PROXY}/resources?instanceId=${encodeURIComponent(instanceId)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err: { message?: string }) => Promise.reject(new Error(err?.message ?? res.statusText)));
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : typeof data === "object" && data !== null ? [data] : []);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load resources";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading resources…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error}. Check the Coolify API and proxy configuration.
      </p>
    );
  }
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No resources. Add resources from the Coolify UI.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name / ID</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((r, i) => (
            <TableRow key={(r as { uuid?: string; id?: number }).uuid ?? (r as { id?: number }).id ?? i}>
              <TableCell className="font-mono text-xs">
                {(r as { name?: string }).name ?? (r as { uuid?: string }).uuid ?? (r as { id?: number }).id ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {typeof r === "object" && r !== null
                  ? Object.entries(r)
                      .filter(([k]) => !["name", "uuid", "id"].includes(k))
                      .slice(0, 5)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(" · ") || "—"
                  : String(r)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DeploymentsTab({ instanceId }: { instanceId: string }) {
  const [list, setList] = useState<CoolifyDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = `${COOLIFY_PROXY}/deployments?instanceId=${encodeURIComponent(instanceId)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err: { message?: string }) => Promise.reject(new Error(err?.message ?? res.statusText)));
        }
        return res.json() as Promise<CoolifyDeployment[]>;
      })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load deployments";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading deployments…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error}. The Coolify API may use a different path for deployments; check the API reference.
      </p>
    );
  }
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">No deployments listed.</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Application</TableHead>
            <TableHead>Server</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Commit</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((d) => (
            <TableRow key={d.deployment_uuid ?? d.id ?? String(d.application_name)}>
              <TableCell className="font-medium">{d.application_name ?? "—"}</TableCell>
              <TableCell>{d.server_name ?? "—"}</TableCell>
              <TableCell>{d.status ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground max-w-[80px] truncate" title={d.commit}>{d.commit ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs max-w-[140px] truncate text-muted-foreground" title={d.deployment_url}>{d.deployment_url ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground text-xs">{d.created_at ? new Date(d.created_at).toLocaleString() : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CoolifyConfigPanel() {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  if (!instanceId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">
          Select an instance from the Admin → App instances table, or open Configure on a Coolify instance.
        </p>
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
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{instanceId.slice(0, 12)}…</code>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">Change</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coolify API</CardTitle>
          <CardDescription>
            Servers, projects, and deployments are read from the Coolify API via the portal proxy. Create and manage
            resources in the Coolify UI or via API.
          </CardDescription>
          <a
            href="https://coolify.io/docs/api-reference/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1 mt-1"
          >
            API reference <ExternalLink className="h-3 w-3" />
          </a>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="servers" className="w-full">
            <TabsList className="flex w-full flex-wrap gap-1">
              <TabsTrigger value="servers" className="flex items-center gap-2">
                <Server className="h-4 w-4" /> Servers
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderGit className="h-4 w-4" /> Projects
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Box className="h-4 w-4" /> Applications
              </TabsTrigger>
              <TabsTrigger value="databases" className="flex items-center gap-2">
                <Database className="h-4 w-4" /> Databases
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Layers className="h-4 w-4" /> Resources
              </TabsTrigger>
              <TabsTrigger value="deployments" className="flex items-center gap-2">
                <Rocket className="h-4 w-4" /> Deployments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="servers" className="mt-4">
              <ServersTab instanceId={instanceId} />
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
              <ProjectsTab instanceId={instanceId} />
            </TabsContent>
            <TabsContent value="applications" className="mt-4">
              <ApplicationsTab instanceId={instanceId} />
            </TabsContent>
            <TabsContent value="databases" className="mt-4">
              <DatabasesTab instanceId={instanceId} />
            </TabsContent>
            <TabsContent value="resources" className="mt-4">
              <ResourcesTab instanceId={instanceId} />
            </TabsContent>
            <TabsContent value="deployments" className="mt-4">
              <DeploymentsTab instanceId={instanceId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
