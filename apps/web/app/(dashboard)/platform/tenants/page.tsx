"use client"

import { useState } from "react"
import useSWR from "swr"
import { Building2, RefreshCw, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

type TenantRow = {
  id: string
  slug: string
  name: string
  status: string
  is_platform_owner: boolean | null
  created_at: string
  updated_at: string
}

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const data = await r.json()
  if (!r.ok) {
    const err = new Error(typeof data?.error === "string" ? data.error : r.statusText) as Error & {
      status: number
      details?: string
    }
    err.status = r.status
    err.details = data?.details
    throw err
  }
  return data
}

export default function PlatformTenantsPage() {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { data, error, isLoading, mutate } = useSWR<{ tenants: TenantRow[] }>(
    "/api/mt/tenants",
    fetcher,
    { revalidateOnFocus: false }
  )

  const tenants = data?.tenants ?? []
  const err = error as (Error & { status?: number; details?: string }) | undefined

  async function handleStatusChange(tenantId: string, newStatus: string) {
    setUpdatingId(tenantId)
    try {
      const r = await fetch(`/api/mt/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const body = await r.json()
      if (!r.ok) throw new Error(body?.error ?? r.statusText)
      await mutate()
    } catch (e) {
      console.error("Failed to update tenant status:", e)
    } finally {
      setUpdatingId(null)
    }
  }

  if (err?.status === 401) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>
            You must be signed in to manage tenants.{" "}
            <Link href="/auth/login" className="underline">
              Sign in
            </Link>
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
          <AlertDescription>
            Only platform-owner members can view and manage tenants. Your account is not an overseer.
          </AlertDescription>
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
            Set <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_SUPABASE_MT_URL</code> and{" "}
            <code className="text-xs bg-muted px-1 rounded">SUPABASE_MT_SERVICE_ROLE_KEY</code> in .env.local and
            start the MT project with <code className="text-xs bg-muted px-1 rounded">pnpm supabase-mt:start</code>.
            See <Link href="/docs/admin" className="underline">admin docs</Link> and{" "}
            <code className="text-xs bg-muted px-1 rounded">docs/MULTITENANT-ONBOARDING.md</code>.
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
            <Building2 className="h-6 w-6 text-primary" />
            Tenants
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-tenant (MT) Supabase: list and manage tenants. Only platform-owner members can access this page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ) : err ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load tenants</AlertTitle>
          <AlertDescription>{err.message}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All tenants</CardTitle>
            <CardDescription>
              Status can be changed to active, suspended, or archived. Platform-owner tenant has full overseer access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6">No tenants yet. Provision the first tenant with the CLI (see docs/MULTITENANT-ONBOARDING.md).</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-sm">{t.slug}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>
                        <Select
                          value={t.status}
                          onValueChange={(v) => handleStatusChange(t.id, v)}
                          disabled={updatingId === t.id}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {t.is_platform_owner ? (
                          <Badge variant="secondary" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Platform owner
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {t.updated_at ? new Date(t.updated_at).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
