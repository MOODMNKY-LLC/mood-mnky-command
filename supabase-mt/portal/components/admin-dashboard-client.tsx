"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard, Building2, User, Database, Package, Server, Factory, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SupabaseManagerDialog from "@/components/index";
import { AdminAppInstances } from "@/components/admin-app-instances";
import { AdminStackSubscriptions } from "@/components/admin-stack-subscriptions";
import { getCoolifyLogsByApplicationUuid, syncComposeStack } from "@/lib/app-factory/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollText } from "lucide-react";

const projectRef =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_MT_PROJECT_REF ?? "" : "";

const COMPOSE_STACKS = ["agent-stack", "full-stack"] as const;

function AppFactorySyncCard() {
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const handleSync = async (templateKey: string) => {
    setSyncingKey(templateKey);
    try {
      const result = await syncComposeStack(templateKey);
      if (result.success) {
        toast.success(`Compose synced: ${result.template_key}`);
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sync failed";
      toast.error(msg);
    } finally {
      setSyncingKey(null);
    }
  };
  return (
    <div className="main-glass-panel-card main-float p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Factory className="h-5 w-5" />
        App Factory
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Sync Docker Compose from the repo into Supabase for Coolify deployments (agent-stack or full-stack).
        Run periodically so deployment-ready content stays in sync with the repo.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {COMPOSE_STACKS.map((key) => (
          <Button
            key={key}
            onClick={() => handleSync(key)}
            disabled={syncingKey !== null}
            variant={key === "agent-stack" ? "default" : "secondary"}
          >
            {syncingKey === key ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing…
              </>
            ) : (
              `Sync compose (${key})`
            )}
          </Button>
        ))}
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/app-factory/launch">App Factory launch</Link>
        </Button>
      </div>
      <CoolifyLogsByUuid />
    </div>
  );
}

function CoolifyLogsByUuid() {
  const [uuid, setUuid] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleFetch = async () => {
    const v = uuid.trim();
    if (!v) {
      toast.error("Enter a Coolify application UUID (e.g. from Coolify or script --list).");
      return;
    }
    setLoading(true);
    setError(null);
    setLogs(null);
    const result = await getCoolifyLogsByApplicationUuid(v, 500);
    setLoading(false);
    if (result.success) {
      setLogs(result.logs);
      setOpen(true);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  return (
    <>
      <div className="mt-6 pt-4 border-t border-border/50">
        <p className="text-sm font-medium text-muted-foreground mb-2">Coolify logs by application UUID (platform admin)</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Application UUID (e.g. bk0gso4kg8scs44g8oo48csg)"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            className="max-w-xs font-mono text-sm"
          />
          <Button variant="secondary" size="sm" onClick={handleFetch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
            <span className="ml-1">{loading ? "Fetching…" : "View logs"}</span>
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Coolify logs</DialogTitle>
            <DialogDescription>Last 500 lines. Not available if the application is stopped.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-md border bg-muted/30 p-3 overflow-auto">
            {logs != null && (
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">{logs}</pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminDashboardClient() {
  const [backofficeOpen, setBackofficeOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const listener = () => setIsMobile(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Config & backoffice</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Supabase backoffice (database, auth, storage, users, secrets, logs) and quick links.
        </p>
      </div>

      {/* Supabase backoffice */}
      <div className="main-glass-panel-card main-float p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase backoffice
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Database, Storage, Auth, Users, Secrets, Logs, and Suggestions for the MT project (via
          Management API).
        </p>
        {projectRef ? (
          <div className="mt-4">
            <Button onClick={() => setBackofficeOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Open backoffice
            </Button>
            <SupabaseManagerDialog
              projectRef={projectRef}
              open={backofficeOpen}
              onOpenChange={setBackofficeOpen}
              isMobile={isMobile}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-500">
            Set <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_SUPABASE_MT_PROJECT_REF</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5">SUPABASE_MANAGEMENT_API_TOKEN</code> in
            .env.local to use the backoffice. Project ref is in the Supabase Dashboard URL.
          </p>
        )}
      </div>

      {/* Services / Offerings */}
      <div className="main-glass-panel-card main-float p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Services & offerings
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Granular app services (per-app configuration) or full MOOD MNKY DevOps/Agent stack provisioning.
        </p>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="#app-instances">
                Granular app services
              </Link>
            </Button>
          </li>
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin#stack-subscriptions">
                Full stack (DevOps/Agent)
              </Link>
            </Button>
          </li>
        </ul>
      </div>

      {/* App Factory — Sync compose from repo */}
      <AppFactorySyncCard />

      {/* Infrastructure — Proxmox */}
      <div className="main-glass-panel-card main-float p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Server className="h-5 w-5" />
          Infrastructure
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Proxmox cluster and nodes; use with Ansible and provisioning runbooks.
        </p>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/proxmox">
              Proxmox dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* App instances (Flowise / n8n / MinIO / Nextcloud / Coolify) */}
      <div id="app-instances">
        <AdminAppInstances />
      </div>

      {/* Stack subscription requests (platform admin) */}
      <AdminStackSubscriptions />

      {/* Quick links */}
      <div className="main-glass-panel-card main-float p-6">
        <h3 className="text-lg font-semibold">Quick links</h3>
        <p className="mt-1 text-sm text-muted-foreground">Portal and organization navigation.</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </li>
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="/onboarding">
                <Building2 className="mr-2 h-4 w-4" />
                Create organization
              </Link>
            </Button>
          </li>
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
