"use client"

import { use, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  ListFilter,
  ArrowLeft,
  Link2,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Wrench,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
  updated_at: string
}

export default function FunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [registering, setRegistering] = useState(false)
  const [copied, setCopied] = useState(false)
  const [updatingSandbox, setUpdatingSandbox] = useState(false)

  const { id } = use(params)
  const { data, isLoading, mutate } = useSWR<{ funnel: Funnel }>(
    `/api/funnels/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const funnel = data?.funnel

  async function handleRegisterWebhook() {
    if (!funnel || !funnel.provider_form_id) return
    setRegistering(true)
    try {
      const res = await fetch(`/api/funnels/${funnel.id}/webhook/register`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? "Failed to register webhook")
        return
      }
      mutate()
    } finally {
      setRegistering(false)
    }
  }

  async function handleSandboxChange(checked: boolean) {
    if (!funnel) return
    setUpdatingSandbox(true)
    try {
      const res = await fetch(`/api/funnels/${funnel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandbox: checked }),
      })
      if (res.ok) mutate()
    } finally {
      setUpdatingSandbox(false)
    }
  }

  function copyRunUrl() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/funnels/run/${funnel?.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading || !funnel) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/platform/funnels">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Funnels
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {funnel.name}
            </h1>
            <Badge
              variant="secondary"
              className={
                funnel.status === "active"
                  ? "bg-success/10 text-success"
                  : "bg-muted"
              }
            >
              {funnel.status}
            </Badge>
            {funnel.sandbox && (
              <Badge variant="outline" className="text-amber-600 border-amber-600/50">
                Sandbox
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            JotForm Form ID: {funnel.provider_form_id ?? "—"}
          </p>
        </div>
        <Link href={`/platform/funnels/${id}/builder`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Form Builder
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" />
              Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {funnel.webhook_id ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/10 text-success">Registered</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submissions will be sent to your webhook endpoint automatically.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Register a webhook to receive form submissions in real time.
                </p>
                <Button
                  size="sm"
                  onClick={handleRegisterWebhook}
                  disabled={registering || !funnel.provider_form_id}
                >
                  {registering ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Register Webhook
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4 text-primary" />
              Run URL
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Share this URL with users to run the funnel (embedded JotForm).
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/funnels/run/${funnel.id}`
                  : `/funnels/run/${funnel.id}`}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyRunUrl}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <Link href={`/funnels/run/${funnel.id}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary" className="w-full">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Open Run Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListFilter className="h-4 w-4 text-primary" />
            Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs text-foreground mt-0.5">
                {funnel.id}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">JotForm Form</dt>
              <dd className="mt-0.5">
                {funnel.provider_form_id ? (
                  <a
                    href={`https://form.jotform.com/${funnel.provider_form_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    form.jotform.com/{funnel.provider_form_id}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-foreground">
                {new Date(funnel.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <div className="flex items-center gap-2 mt-1">
                <Checkbox
                  id="sandbox"
                  checked={!!funnel.sandbox}
                  onCheckedChange={(v) => handleSandboxChange(!!v)}
                  disabled={updatingSandbox}
                />
                <Label htmlFor="sandbox" className="text-sm font-normal cursor-pointer">
                  Use as sandbox (test only)
                </Label>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
