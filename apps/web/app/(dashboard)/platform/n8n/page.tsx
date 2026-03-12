"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Skeleton } from "@/components/ui/skeleton"
import { GitBranch, Settings, ExternalLink, Box, Play, Square, Trash2, Loader2 } from "lucide-react"

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json().then((d) => (r.ok ? d : Promise.reject(d))))

interface N8nConfigApi {
  configured: boolean
  baseUrl?: string
  message?: string
}

interface N8nWorkflow {
  id?: string
  name: string
  active?: boolean
  updatedAt?: string
  tags?: Array<{ id: string; name: string }>
}

interface N8nWorkflowList {
  data: N8nWorkflow[]
  nextCursor?: string | null
}

interface N8nExecution {
  id: string
  workflowId: string
  workflowData?: { name?: string }
  status?: string
  startedAt: string
  finished?: boolean
}

interface N8nExecutionList {
  data: N8nExecution[]
  nextCursor?: string | null
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function N8nPage() {
  const [detailWorkflow, setDetailWorkflow] = useState<N8nWorkflow | null>(null)
  const [deleteWorkflow, setDeleteWorkflow] = useState<N8nWorkflow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [n8nBaseUrl, setN8nBaseUrl] = useState<string | null>(null)

  const { data: configData } = useSWR<N8nConfigApi>("/api/labz/n8n/config", fetcher, {
    revalidateOnFocus: false,
  })
  const configured = configData?.configured ?? false
  const configMessage = configData?.message

  const { data: workflowsData, error: workflowsError, mutate: mutateWorkflows } = useSWR<N8nWorkflowList>(
    configured ? "/api/labz/n8n/workflows?limit=50" : null,
    fetcher,
    { revalidateOnFocus: false }
  )
  const workflows = workflowsData?.data ?? []
  const workflowsNextCursor = workflowsData?.nextCursor

  const { data: executionsData, mutate: mutateExecutions } = useSWR<N8nExecutionList>(
    configured ? "/api/labz/n8n/executions?limit=20" : null,
    fetcher,
    { revalidateOnFocus: false }
  )
  const executions = executionsData?.data ?? []

  const openInN8n = useCallback(
    (id: string) => {
      if (n8nBaseUrl) window.open(`${n8nBaseUrl.replace(/\/$/, "")}/workflow/${id}`, "_blank")
    },
    [n8nBaseUrl]
  )

  const handleActivate = useCallback(
    async (id: string) => {
      setActionLoading(id)
      try {
        const r = await fetch(`/api/labz/n8n/workflows/${id}/activate`, { method: "POST" })
        const d = await r.json()
        if (r.ok) {
          mutateWorkflows()
          mutateExecutions()
          setDetailWorkflow((w) => (w?.id === id ? { ...w, active: true } : w))
        } else throw new Error(d.error ?? "Failed")
      } catch (e) {
        console.error(e)
      } finally {
        setActionLoading(null)
      }
    },
    [mutateWorkflows, mutateExecutions]
  )

  const handleDeactivate = useCallback(
    async (id: string) => {
      setActionLoading(id)
      try {
        const r = await fetch(`/api/labz/n8n/workflows/${id}/deactivate`, { method: "POST" })
        const d = await r.json()
        if (r.ok) {
          mutateWorkflows()
          mutateExecutions()
          setDetailWorkflow((w) => (w?.id === id ? { ...w, active: false } : w))
        } else throw new Error(d.error ?? "Failed")
      } catch (e) {
        console.error(e)
      } finally {
        setActionLoading(null)
      }
    },
    [mutateWorkflows, mutateExecutions]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      setActionLoading(id)
      try {
        const r = await fetch(`/api/labz/n8n/workflows/${id}`, { method: "DELETE" })
        if (r.ok) {
          setDeleteWorkflow(null)
          setDetailWorkflow(null)
          mutateWorkflows()
          mutateExecutions()
        } else {
          const d = await r.json()
          throw new Error(d.error ?? "Failed")
        }
      } catch (e) {
        console.error(e)
      } finally {
        setActionLoading(null)
      }
    },
    [mutateWorkflows, mutateExecutions]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <GitBranch className="h-6 w-6" />
          n8n (MNKY AUTO)
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Workflow automation. Configure credentials in Platform → Settings (mnky-auto) or set N8N_API_URL and N8N_API_KEY in .env.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>
            n8n instance used for workflow list, activate/deactivate, and executions. Same config as Service Analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configData === undefined ? (
            <Skeleton className="h-8 w-48" />
          ) : configured ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Configured</Badge>
              {configData.baseUrl && (
                <span className="text-sm text-muted-foreground font-mono">{configData.baseUrl}</span>
              )}
              <Link href="/platform/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </Link>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                {configMessage ?? "Not configured."}{" "}
                <Link href="/platform/settings" className="underline">
                  Platform → Settings
                </Link>{" "}
                to add mnky-auto (base URL + API key), or set N8N_API_URL and N8N_API_KEY in .env. See{" "}
                <code className="text-xs">docs/SERVICES-ENV.md</code>.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {configured && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflows</CardTitle>
              <CardDescription>
                List from n8n. Activate/deactivate, view, or delete. Open in n8n to edit or get webhook URL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workflowsError && (
                <Alert variant="destructive">
                  <AlertDescription>{(workflowsError as { error?: string })?.error ?? "Failed to load workflows."}</AlertDescription>
                </Alert>
              )}
              {!workflowsError && workflows.length === 0 && !workflowsData && (
                <Skeleton className="h-24 w-full" />
              )}
              {!workflowsError && workflows.length === 0 && workflowsData && (
                <p className="text-sm text-muted-foreground">No workflows. Create them in n8n.</p>
              )}
              {!workflowsError && workflows.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((w) => (
                      <TableRow key={w.id ?? w.name}>
                        <TableCell className="font-medium">{w.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{w.id ?? "—"}</TableCell>
                        <TableCell>
                          {w.active ? (
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(w.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDetailWorkflow(w)
                                setN8nBaseUrl(null)
                                fetch("/api/labz/n8n/config?forLink=1")
                                  .then((r) => r.json())
                                  .then((d) => d.baseUrl && setN8nBaseUrl(d.baseUrl))
                              }}
                            >
                              View
                            </Button>
                            {w.id && (
                              <>
                                {w.active ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === w.id}
                                    onClick={() => handleDeactivate(w.id!)}
                                  >
                                    {actionLoading === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoading === w.id}
                                    onClick={() => handleActivate(w.id!)}
                                  >
                                    {actionLoading === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteWorkflow(w)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {workflowsNextCursor && (
                <p className="text-xs text-muted-foreground mt-2">More workflows available in n8n. Use cursor for pagination.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent executions</CardTitle>
              <CardDescription>Last 20 executions across all workflows.</CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length === 0 && !executionsData && <Skeleton className="h-16 w-full" />}
              {executions.length === 0 && executionsData && (
                <p className="text-sm text-muted-foreground">No executions yet.</p>
              )}
              {executions.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Execution ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.workflowData?.name ?? e.workflowId}</TableCell>
                        <TableCell className="font-mono text-xs">{e.id}</TableCell>
                        <TableCell>
                          {e.finished === false ? (
                            <Badge variant="secondary">Running</Badge>
                          ) : e.status === "error" ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : (
                            <Badge variant="outline">Success</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatDate(e.startedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Box className="h-4 w-4" />
                Infra artifacts
              </CardTitle>
              <CardDescription>
                Exported n8n workflow JSON files are published to Supabase Storage. See Infra Artifacts and docs/INFRA-STORAGE.md.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/platform/artifacts">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Infra Artifacts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!detailWorkflow} onOpenChange={(open) => !open && setDetailWorkflow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailWorkflow?.name ?? "Workflow"}</DialogTitle>
            <DialogDescription>ID: {detailWorkflow?.id ?? "—"}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {detailWorkflow?.id && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openInN8n(detailWorkflow.id!)}
                  disabled={!n8nBaseUrl}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in n8n
                </Button>
                {detailWorkflow.active ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === detailWorkflow.id}
                    onClick={() => handleDeactivate(detailWorkflow.id!)}
                  >
                    {actionLoading === detailWorkflow.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4 mr-1" />}
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading === detailWorkflow.id}
                    onClick={() => handleActivate(detailWorkflow.id!)}
                  >
                    {actionLoading === detailWorkflow.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                    Activate
                  </Button>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Webhook URL and full editing are in n8n. Use &quot;Open in n8n&quot; when the instance URL is known.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDetailWorkflow(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteWorkflow} onOpenChange={(open) => !open && setDeleteWorkflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{deleteWorkflow?.name}&quot; from n8n? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteWorkflow?.id && handleDelete(deleteWorkflow.id)}
            >
              {actionLoading === deleteWorkflow?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
