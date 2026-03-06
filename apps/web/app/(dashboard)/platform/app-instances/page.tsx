"use client"

import { useState } from "react"
import useSWR from "swr"
import { Link2, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

type TenantRow = { id: string; slug: string; name: string }
type AppInstanceRow = {
  id: string
  tenant_id: string
  app_type: string
  base_url: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const data = await r.json()
  if (!r.ok) {
    const err = new Error(typeof data?.error === "string" ? data.error : r.statusText) as Error & {
      status: number
    }
    err.status = r.status
    throw err
  }
  return data
}

const APP_TYPES = ["flowise", "n8n"] as const

export default function PlatformAppInstancesPage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({ app_type: "flowise", base_url: "" })
  const [editForm, setEditForm] = useState<{ id: string; base_url: string; settingsJson: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: tenantsData, error: tenantsError, mutate: mutateTenants } = useSWR<{ tenants: TenantRow[] }>(
    "/api/mt/tenants",
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: instancesData, error: instancesError, mutate: mutateInstances } = useSWR<{ appInstances: AppInstanceRow[] }>(
    selectedTenantId ? `/api/mt/app-instances?tenantId=${encodeURIComponent(selectedTenantId)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const tenants = tenantsData?.tenants ?? []
  const appInstances = instancesData?.appInstances ?? []
  const err = (tenantsError || (selectedTenantId ? instancesError : null)) as (Error & { status?: number }) | undefined

  async function handleAdd() {
    if (!selectedTenantId) return
    setSaving(true)
    setSaveError(null)
    try {
      const r = await fetch("/api/mt/app-instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          app_type: addForm.app_type,
          base_url: addForm.base_url.trim() || null,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? r.statusText)
      setAddOpen(false)
      setAddForm({ app_type: "flowise", base_url: "" })
      await mutateInstances()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit() {
    if (!editForm) return
    setSaving(true)
    setSaveError(null)
    try {
      let settings: Record<string, unknown> = {}
      if (editForm.settingsJson.trim()) {
        try {
          settings = JSON.parse(editForm.settingsJson)
        } catch {
          setSaveError("Invalid JSON in settings")
          setSaving(false)
          return
        }
      }
      const r = await fetch(`/api/mt/app-instances/${editForm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_url: editForm.base_url.trim() || null, settings }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? r.statusText)
      setEditOpen(false)
      setEditForm(null)
      await mutateInstances()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setSaving(true)
    setSaveError(null)
    try {
      const r = await fetch(`/api/mt/app-instances/${id}`, { method: "DELETE" })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? r.statusText)
      setDeleteId(null)
      await mutateInstances()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  function openEdit(row: AppInstanceRow) {
    setEditForm({
      id: row.id,
      base_url: row.base_url ?? "",
      settingsJson: JSON.stringify(row.settings ?? {}, null, 2),
    })
    setEditOpen(true)
  }

  if (err?.status === 401) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>
            You must be signed in. <Link href="/auth/login" className="underline">Sign in</Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (err?.status === 403) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertTitle>Access denied</AlertTitle>
          <AlertDescription>Only platform-owner members can manage app instances.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (err?.status === 503) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert>
          <AlertTitle>Multi-tenant project not configured</AlertTitle>
          <AlertDescription>
            Set MT env vars and start with <code className="text-xs bg-muted px-1 rounded">pnpm supabase-mt:start</code>.
            See <Link href="/docs/admin" className="underline">admin docs</Link> and docs/MULTITENANT-APP-INSTANCES.md.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            App Instances
          </h1>
          <p className="text-sm text-muted-foreground">
            Per-tenant config for Flowise, n8n, or other apps. Used when multiple instances exist; fall back to env when no row.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { mutateTenants(); mutateInstances(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {saveError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By tenant</CardTitle>
          <CardDescription>Select a tenant to view and manage its app instances (base URL, settings).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm text-muted-foreground">Tenant</Label>
            <Select
              value={selectedTenantId ?? ""}
              onValueChange={(v) => setSelectedTenantId(v || null)}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTenantId && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add instance
              </Button>
            )}
          </div>

          {!selectedTenantId ? (
            <p className="text-sm text-muted-foreground py-4">Select a tenant above.</p>
          ) : (
            <>
              {instancesData === undefined && !instancesError ? (
                <Skeleton className="h-24 w-full" />
              ) : appInstances.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No app instances for this tenant. Add one to override env (e.g. Flowise/n8n URL) for this tenant.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>App type</TableHead>
                      <TableHead>Base URL</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appInstances.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-sm">{row.app_type}</TableCell>
                        <TableCell className="text-sm">{row.base_url || "—"}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add app instance</DialogTitle>
            <DialogDescription>Add Flowise, n8n, or another app type for this tenant.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>App type</Label>
              <Select value={addForm.app_type} onValueChange={(v) => setAddForm((f) => ({ ...f, app_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Base URL (optional)</Label>
              <Input
                placeholder="https://flowise-tenant.example.com"
                value={addForm.base_url}
                onChange={(e) => setAddForm((f) => ({ ...f, base_url: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) setEditForm(null); setEditOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit app instance</DialogTitle>
            <DialogDescription>Update base URL and settings (JSON).</DialogDescription>
          </DialogHeader>
          {editForm && (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Base URL</Label>
                  <Input
                    value={editForm.base_url}
                    onChange={(e) => setEditForm((f) => f ? { ...f, base_url: e.target.value } : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Settings (JSON)</Label>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    value={editForm.settingsJson}
                    onChange={(e) => setEditForm((f) => f ? { ...f, settingsJson: e.target.value } : null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete app instance?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the per-tenant config. The app will fall back to env for this tenant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
