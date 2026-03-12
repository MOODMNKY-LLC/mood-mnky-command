"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ListFilter, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function FunnelRunPage({
  params,
}: {
  params: Promise<{ funnelId: string }>
}) {
  const { funnelId } = use(params)
  const [providerFormId, setProviderFormId] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function startRun() {
      try {
        const [funnelRes, runRes] = await Promise.all([
          fetch(`/api/funnels/${funnelId}`),
          fetch(`/api/funnels/${funnelId}/runs`, { method: "POST" }),
        ])
        const funnelJson = await funnelRes.json()
        const runJson = await runRes.json()
        if (!funnelRes.ok || !funnelJson.funnel) {
          setError("Funnel not found")
          return
        }
        if (!runRes.ok) {
          setError(runJson.error ?? "Failed to start funnel")
          return
        }
        if (!funnelJson.funnel.provider_form_id) {
          setError("Form not ready")
          setProviderFormId(null)
          return
        }
        setProviderFormId(funnelJson.funnel.provider_form_id)
        setRunId(runJson.runId)
        setUserId(runJson.userId)
      } catch {
        setError("Failed to start funnel")
      } finally {
        setLoading(false)
      }
    }
    startRun()
  }, [funnelId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Starting your fragrance intake...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
            {error === "Form not ready" && (
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                This funnel has no form yet. Use the Form Builder to create and sync a form to JotForm.
              </p>
            )}
            <div className="flex gap-2 mt-4">
              {error === "Form not ready" && (
                <Link href={`/platform/funnels/${funnelId}/builder`}>
                  <Button size="sm">Open Form Builder</Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" size="sm">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const embedUrl = new URL(
    `https://form.jotform.com/${providerFormId}`
  )
  if (runId) embedUrl.searchParams.set("run_id", runId)
  if (userId) embedUrl.searchParams.set("user_id", userId)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Fragrance Intake
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <iframe
            src={embedUrl.toString()}
            title="Fragrance Intake Form"
            className="w-full min-h-[600px] border-0 rounded-b-lg"
            allowFullScreen
          />
        </CardContent>
      </Card>
    </div>
  )
}
