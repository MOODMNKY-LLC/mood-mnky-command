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
import { Server, FolderGit, Rocket, Loader2, ExternalLink } from "lucide-react";

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

type CoolifyProject = { uuid?: string; name?: string; description?: string };

type CoolifyDeployment = {
  uuid?: string;
  status?: string;
  application?: { name?: string };
  server?: { name?: string };
};

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
            <TableRow key={p.uuid ?? p.name ?? ""}>
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
            <TableHead>UUID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((d) => (
            <TableRow key={d.uuid ?? String(d.application?.name)}>
              <TableCell className="font-medium">{d.application?.name ?? "—"}</TableCell>
              <TableCell>{d.server?.name ?? "—"}</TableCell>
              <TableCell>{d.status ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={d.uuid}>
                {d.uuid ?? "—"}
              </TableCell>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="servers" className="flex items-center gap-2">
                <Server className="h-4 w-4" /> Servers
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderGit className="h-4 w-4" /> Projects
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
            <TabsContent value="deployments" className="mt-4">
              <DeploymentsTab instanceId={instanceId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
