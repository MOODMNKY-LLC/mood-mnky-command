"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  ListFilter,
  Plus,
  ArrowLeft,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Funnel {
  id: string
  name: string
  description: string | null
  provider_form_id: string | null
  webhook_id: string | null
  status: string
  sandbox?: boolean
  created_at: string
}

export default function FunnelsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [providerFormId, setProviderFormId] = useState("")
  const [sandbox, setSandbox] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, mutate } = useSWR<{ funnels: Funnel[] }>(
    "/api/funnels",
    fetcher,
    { revalidateOnFocus: false }
  )

  const funnels = data?.funnels ?? []

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const res = await fetch("/api/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          provider_form_id: providerFormId.trim() || undefined,
          sandbox,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Failed to create funnel")
        return
      }
      setCreateOpen(false)
      setName("")
      setDescription("")
      setProviderFormId("")
      setSandbox(false)
      mutate()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/platform">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Platform
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Funnels
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            JotForm intake forms linked to fragrance crafting flows
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Funnel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Funnel</DialogTitle>
                <DialogDescription>
                  Link a JotForm form to the app. Enter an existing form ID, or
                  leave blank to build a new form in the builder.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Fragrance Intake"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="provider_form_id">JotForm Form ID (optional)</Label>
                  <Input
                    id="provider_form_id"
                    value={providerFormId}
                    onChange={(e) => setProviderFormId(e.target.value)}
                    placeholder="240123456789 or leave blank to build in-app"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sandbox"
                    checked={sandbox}
                    onCheckedChange={(v) => setSandbox(!!v)}
                  />
                  <Label htmlFor="sandbox" className="text-sm font-normal cursor-pointer">
                    Use as sandbox (test only)
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Guided fragrance crafting intake"
                    rows={2}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListFilter className="h-4 w-4 text-primary" />
            Funnel Definitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : funnels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListFilter className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium text-foreground">
                No funnels yet
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Create a funnel to link a JotForm form. Then register the
                webhook and share the run URL with users.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Funnel
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {funnels.map((funnel) => (
                <Link key={funnel.id} href={`/platform/funnels/${funnel.id}`}>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {funnel.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            funnel.status === "active"
                              ? "bg-success/10 text-success"
                              : funnel.status === "draft"
                                ? "bg-muted"
                                : "bg-muted"
                          }`}
                        >
                          {funnel.status}
                        </Badge>
                        {funnel.sandbox && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-600/50">
                            Sandbox
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        Form ID: {funnel.provider_form_id ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {funnel.webhook_id ? (
                        <Badge variant="outline" className="text-[10px]">
                          Webhook
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          No webhook
                        </Badge>
                      )}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
