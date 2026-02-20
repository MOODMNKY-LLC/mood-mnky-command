"use client"

import React, { useCallback, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  ListOrdered,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const DEFAULT_APP_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://mnky-command.moodmnky.com"

export default function StorefrontAssistantPage() {
  const [appBaseUrl, setAppBaseUrl] = useState(DEFAULT_APP_BASE_URL)
  const [widgetStatus, setWidgetStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle")
  const [apiStatus, setApiStatus] = useState<"idle" | "loading" | "ok" | "fail">("idle")
  const [copied, setCopied] = useState(false)

  const widgetUrl = `${appBaseUrl.replace(/\/$/, "")}/assistant/widget`
  const apiUrl = `${appBaseUrl.replace(/\/$/, "")}/api/storefront-assistant`

  const handleVerifyWidget = useCallback(async () => {
    setWidgetStatus("loading")
    try {
      const res = await fetch("/assistant/widget", { method: "GET" })
      setWidgetStatus(res.ok ? "ok" : "fail")
    } catch {
      setWidgetStatus("fail")
    }
  }, [])

  const handleVerifyApi = useCallback(async () => {
    setApiStatus("loading")
    try {
      const res = await fetch("/api/storefront-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user" as const,
              parts: [{ type: "text" as const, text: "Hi" }],
            },
          ],
        }),
      })
      setApiStatus(res.ok ? "ok" : "fail")
    } catch {
      setApiStatus("fail")
    }
  }, [])

  const handleCopyAppBaseUrl = useCallback(() => {
    const url = appBaseUrl.replace(/\/$/, "")
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [appBaseUrl])

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
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Storefront Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enable and verify the MNKY Assistant embed on your Shopify theme. Use the same App base URL in Theme Editor as below (see <code className="rounded bg-muted px-1 text-xs">docs/SHOPIFY-APP-URL-CONFIG.md</code> for full setup).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            Enable in Shopify Theme Editor
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Follow these steps to show the assistant on your storefront.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
            <li>In Shopify Admin go to <strong>Online Store</strong> → <strong>Themes</strong>.</li>
            <li>Click <strong>Customize</strong> on your current theme.</li>
            <li>In the theme editor, open <strong>Theme settings</strong> (or the left panel) and find <strong>App embeds</strong>.</li>
            <li>Enable the <strong>MNKY Assistant</strong> app embed.</li>
            <li>Set <strong>App base URL</strong> to the value below (copy and paste).</li>
            <li>Adjust position and styling if desired, then <strong>Save</strong>.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">App base URL</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Use this URL in the theme embed settings. The widget loads from <code className="rounded bg-muted px-1 text-xs">/assistant/widget</code> on this host.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={appBaseUrl.replace(/\/$/, "")}
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopyAppBaseUrl}>
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Recommended: <strong>{appBaseUrl.replace(/\/$/, "")}</strong> (no trailing slash)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Health checks
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Verify the widget and API respond correctly from this environment.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVerifyWidget}
                disabled={widgetStatus === "loading"}
              >
                {widgetStatus === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify widget"
                )}
              </Button>
              {widgetStatus === "ok" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> OK
                </span>
              )}
              {widgetStatus === "fail" && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <XCircle className="h-4 w-4" /> Failed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleVerifyApi}
                disabled={apiStatus === "loading"}
              >
                {apiStatus === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify API"
                )}
              </Button>
              {apiStatus === "ok" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> OK
                </span>
              )}
              {apiStatus === "fail" && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <XCircle className="h-4 w-4" /> Failed
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Widget: <code className="rounded bg-muted px-1">{widgetUrl}</code> · API: <code className="rounded bg-muted px-1">{apiUrl}</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional: App Proxy (same-origin)</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            For tighter security and same-origin embed delivery, you can configure a Shopify App Proxy so the assistant is served from your store domain. This reduces CORS complexity and can improve embed reliability.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            In Shopify Admin → Apps → [Your app] → App setup → App proxy: set subpath (e.g. <code className="rounded bg-muted px-1">/apps/assistant</code>) and proxy URL to your app base URL. Then use the proxy path in the theme embed if you switch to proxy-based loading.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/assistant/widget" target="_blank" rel="noopener noreferrer">
            Open widget page
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
