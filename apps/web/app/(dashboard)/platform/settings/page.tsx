"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR from "swr"
import { Settings, CheckCircle2, XCircle, FileText, Box, Plus, Pencil, Trash2, Server } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const data = await r.json()
  if (!r.ok) throw new Error(typeof data?.error === "string" ? data.error : r.statusText)
  return data
}

type CredentialsStatus = {
  services: { serviceId: string; name: string; configured: boolean }[]
  notion: boolean
  shopify: boolean
  encryptionConfigured?: boolean
}

type DeployedServiceRow = {
  id: string
  service_id: string
  base_url: string | null
  enabled: boolean
  created_at?: string
  updated_at?: string
}

type DashboardConfigApi = {
  sectionOrder: string[]
  showLabzHubCard: boolean
  defaultStatsRefreshInterval: number
  showLabzPagesCountInStats: boolean
  showConnectAlert: boolean
}

export default function PlatformSettingsPage() {
  const [deployedServiceDialogOpen, setDeployedServiceDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deployForm, setDeployForm] = useState({
    service_id: "",
    base_url: "",
    credentialsJson: "",
  })
  const [deploySaving, setDeploySaving] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dashboardSaving, setDashboardSaving] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const { data: creds, isLoading, error } = useSWR<CredentialsStatus>(
    "/api/labz/settings/credentials-status",
    fetcher,
    { revalidateOnFocus: false },
  )
  const { data: deployedListRaw, error: deployedServicesError, mutate: mutateDeployed } = useSWR<DeployedServiceRow[]>(
    "/api/labz/settings/deployed-services",
    fetcher,
    { revalidateOnFocus: false },
  )
  const deployedList = deployedListRaw ?? []
  const { data: dashboardApi, mutate: mutateDashboard } = useSWR<DashboardConfigApi>(
    "/api/labz/settings/dashboard-config",
    fetcher,
    { revalidateOnFocus: false },
  )
  const [dashboardForm, setDashboardForm] = useState<DashboardConfigApi | null>(null)
  const effectiveDashboard = dashboardForm ?? dashboardApi ?? null

  const openAddDeployed = useCallback(() => {
    setEditingId(null)
    setDeployForm({ service_id: "", base_url: "", credentialsJson: "" })
    setDeployError(null)
    setDeployedServiceDialogOpen(true)
  }, [])
  const openEditDeployed = useCallback(async (id: string) => {
    setEditingId(id)
    setDeployError(null)
    setDeployedServiceDialogOpen(true)
    setDeployForm({ service_id: "", base_url: "", credentialsJson: "" })
    try {
      const r = await fetch(`/api/labz/settings/deployed-services/${id}`)
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? "Failed to load")
      setDeployForm({
        service_id: data.service_id ?? "",
        base_url: data.base_url ?? "",
        credentialsJson:
          data.credentials != null ? JSON.stringify(data.credentials, null, 2) : "",
      })
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Failed to load")
    }
  }, [])
  const saveDeployed = useCallback(async () => {
    setDeploySaving(true)
    setDeployError(null)
    try {
      let credentials: Record<string, unknown> | undefined
      if (deployForm.credentialsJson.trim()) {
        credentials = JSON.parse(deployForm.credentialsJson) as Record<string, unknown>
      }
      if (editingId) {
        const r = await fetch(`/api/labz/settings/deployed-services/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base_url: deployForm.base_url || undefined,
            credentials,
          }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Update failed")
        await mutateDeployed()
        setDeployedServiceDialogOpen(false)
      } else {
        const r = await fetch("/api/labz/settings/deployed-services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: deployForm.service_id,
            base_url: deployForm.base_url || undefined,
            credentials,
          }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? "Create failed")
        await mutateDeployed()
        setDeployedServiceDialogOpen(false)
      }
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setDeploySaving(false)
    }
  }, [editingId, deployForm, mutateDeployed])
  const deleteDeployed = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/labz/settings/deployed-services/${id}`, {
        method: "DELETE",
      })
      if (!r.ok) {
        const data = await r.json()
        throw new Error(data.error ?? "Delete failed")
      }
      await mutateDeployed()
      setDeleteId(null)
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Delete failed")
    }
  }, [mutateDeployed])
  const saveDashboard = useCallback(async () => {
    const payload = effectiveDashboard
    if (!payload) return
    setDashboardSaving(true)
    setDashboardError(null)
    try {
      const r = await fetch("/api/labz/settings/dashboard-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionOrder: payload.sectionOrder,
          showLabzHubCard: payload.showLabzHubCard,
          defaultStatsRefreshInterval: payload.defaultStatsRefreshInterval,
          showLabzPagesCountInStats: payload.showLabzPagesCountInStats,
          showConnectAlert: payload.showConnectAlert,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? "Save failed")
      setDashboardForm(null)
      await mutateDashboard()
    } catch (e) {
      setDashboardError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setDashboardSaving(false)
    }
  }, [effectiveDashboard, mutateDashboard])

  useEffect(() => {
    if (dashboardApi && dashboardForm === null) setDashboardForm(dashboardApi)
  }, [dashboardApi, dashboardForm])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Credentials status, infra artifacts, and dashboard configuration. Configure via .env; see docs for details.
        </p>
      </div>

      {/* Credentials status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Credentials status
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Read-only. Add variables to .env or .env.local per{" "}
            <Link href="/docs/admin" className="text-primary underline">Admin docs</Link>
            {" "}and <code className="text-xs bg-muted px-1 rounded">docs/SERVICES-ENV.md</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">docs/DASHBOARD-ENV.md</code>.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">Failed to load credentials status.</p>
          ) : creds ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">Notion</span>
                {creds.notion ? (
                  <Badge className="bg-success/10 text-success border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" /> Not configured
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">Shopify</span>
                {creds.shopify ? (
                  <Badge className="bg-success/10 text-success border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" /> Not configured
                  </Badge>
                )}
              </div>
              {creds.services.map((s) => (
                <div key={s.serviceId} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium truncate">{s.name}</span>
                  {s.configured ? (
                    <Badge className="bg-success/10 text-success border-0 gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <XCircle className="h-3 w-3" /> Not configured
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Deployed services (DB) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Deployed services (DB)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Optional. Store service_id, base_url, and encrypted credentials in Supabase. Requires{" "}
            <code className="text-xs bg-muted px-1 rounded">SERVICES_CREDENTIALS_ENCRYPTION_KEY</code>{" "}
            in env to add or edit credentials.
          </p>
          {creds && creds.encryptionConfigured === false && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>
                <strong>SERVICES_CREDENTIALS_ENCRYPTION_KEY</strong> is not set. You can list and delete entries, but adding or editing credentials is disabled until the key is configured.
              </AlertDescription>
            </Alert>
          )}
          {deployedServicesError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{deployedServicesError.message}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Dialog open={deployedServiceDialogOpen} onOpenChange={setDeployedServiceDialogOpen}>
                <Button
                  size="sm"
                  onClick={() => {
                    openAddDeployed()
                    setDeployedServiceDialogOpen(true)
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add service
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Edit deployed service" : "Add deployed service"}</DialogTitle>
                    <DialogDescription>
                      Service ID (e.g. nextcloud, jellyfin). Base URL and credentials (JSON) are optional.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ds-service_id">Service ID</Label>
                      <Input
                        id="ds-service_id"
                        value={deployForm.service_id}
                        onChange={(e) => setDeployForm((f) => ({ ...f, service_id: e.target.value }))}
                        placeholder="e.g. nextcloud"
                        disabled={!!editingId}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ds-base_url">Base URL</Label>
                      <Input
                        id="ds-base_url"
                        value={deployForm.base_url}
                        onChange={(e) => setDeployForm((f) => ({ ...f, base_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ds-credentials">Credentials (JSON)</Label>
                      <Textarea
                        id="ds-credentials"
                        value={deployForm.credentialsJson}
                        onChange={(e) => setDeployForm((f) => ({ ...f, credentialsJson: e.target.value }))}
                        placeholder='{"apiKey": "..."}'
                        rows={4}
                        className="font-mono text-xs"
                        disabled={creds?.encryptionConfigured === false}
                      />
                      {creds?.encryptionConfigured === false && (
                        <p className="text-xs text-muted-foreground">Set SERVICES_CREDENTIALS_ENCRYPTION_KEY to enable.</p>
                      )}
                    </div>
                    {deployError && (
                      <p className="text-sm text-destructive">{deployError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeployedServiceDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveDeployed} disabled={deploySaving}>
                      {deploySaving ? "Saving…" : editingId ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {deployedList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deployed services in DB. Add one to store credentials here.</p>
            ) : (
              <ul className="space-y-2">
                {deployedList.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{row.service_id}</span>
                      {row.base_url && (
                        <p className="text-xs text-muted-foreground truncate">{row.base_url}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={row.enabled ? "default" : "secondary"}>
                        {row.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDeployed(row.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog open={deleteId === row.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete deployed service?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove &quot;{row.service_id}&quot; from the database. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => deleteDeployed(row.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Infra artifacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Box className="h-4 w-4" />
            Infra artifacts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Service themes, Docker files, and n8n workflows are published to Supabase Storage. Run{" "}
            <code className="text-xs bg-muted px-1 rounded">pnpm run publish:infra</code> from repo root.
          </p>
        </CardHeader>
        <CardContent>
          <Link
            href="/platform/artifacts"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View artifact versions
          </Link>
          <span className="text-muted-foreground text-sm mx-2">·</span>
          <Link
            href="/docs/admin"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            Admin docs (INFRA-STORAGE)
          </Link>
        </CardContent>
      </Card>

      {/* Dashboard config (DB-backed, editable) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dashboard config</CardTitle>
          <p className="text-sm text-muted-foreground">
            Stored in DB when set here; falls back to <code className="text-xs bg-muted px-1 rounded">lib/dashboard-config.ts</code>.
          </p>
        </CardHeader>
        <CardContent>
          {effectiveDashboard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="dc-hub" className="text-sm font-normal cursor-pointer">Show MNKY LABZ hub card</Label>
                <Switch
                  id="dc-hub"
                  checked={effectiveDashboard.showLabzHubCard}
                  onCheckedChange={(v) =>
                    setDashboardForm({ ...effectiveDashboard, showLabzHubCard: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="dc-pages" className="text-sm font-normal cursor-pointer">Show LABZ pages count in stats</Label>
                <Switch
                  id="dc-pages"
                  checked={effectiveDashboard.showLabzPagesCountInStats}
                  onCheckedChange={(v) =>
                    setDashboardForm({ ...effectiveDashboard, showLabzPagesCountInStats: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="dc-alert" className="text-sm font-normal cursor-pointer">Show connect alert</Label>
                <Switch
                  id="dc-alert"
                  checked={effectiveDashboard.showConnectAlert}
                  onCheckedChange={(v) =>
                    setDashboardForm({ ...effectiveDashboard, showConnectAlert: v })
                  }
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Section order: <code className="text-xs bg-muted px-1 rounded">{effectiveDashboard.sectionOrder.join(", ")}</code>
                {" "}(edit in code for now)
              </div>
              {dashboardError && <p className="text-sm text-destructive">{dashboardError}</p>}
              <Button onClick={saveDashboard} disabled={dashboardSaving}>
                {dashboardSaving ? "Saving…" : "Save dashboard config"}
              </Button>
            </div>
          ) : (
            <Skeleton className="h-24 w-full rounded-lg" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
