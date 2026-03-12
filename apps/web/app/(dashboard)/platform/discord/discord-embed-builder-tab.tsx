"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Code, Send, Loader2, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface StoredWebhook {
  id: string
  webhook_id: string
  channel_id: string
  guild_id: string
  name: string
  avatar: string | null
  created_at: string
  last_used_at: string | null
}

const DEFAULT_PAYLOAD = {
  content: "",
  embeds: [
    {
      title: "Example embed",
      description: "Edit the JSON and preview.",
      color: 5814783,
      footer: { text: "MNKY LABZ" },
    },
  ],
  allowed_mentions: { parse: [] as string[] },
}

interface DiscordEmbedBuilderTabProps {
  guildId: string
}

export function DiscordEmbedBuilderTab({ guildId }: DiscordEmbedBuilderTabProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(DEFAULT_PAYLOAD, null, 2))
  const [webhookId, setWebhookId] = useState("")
  const [sendLoading, setSendLoading] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [saveLoading, setSaveLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  const { data: storedData } = useSWR<{ webhooks?: StoredWebhook[] }>(
    guildId ? `/api/discord/webhooks/stored?guildId=${guildId}` : null,
    fetcher
  )
  const storedWebhooks = storedData?.webhooks ?? []

  const { parsed, parseError } = useMemo(() => {
    try {
      const o = JSON.parse(jsonText) as { content?: string; embeds?: unknown[]; components?: unknown[]; allowed_mentions?: { parse?: string[] } }
      return { parsed: o, parseError: null as string | null }
    } catch (e) {
      return { parsed: null, parseError: e instanceof Error ? e.message : "Invalid JSON" }
    }
  }, [jsonText])

  const handleSend = useCallback(async () => {
    if (!webhookId || !parsed) return
    setSendLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/discord/webhooks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookId,
          content: parsed.content ?? undefined,
          embeds: parsed.embeds ?? undefined,
          components: parsed.components ?? undefined,
          allowed_mentions: parsed.allowed_mentions ?? { parse: [] },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true })
      } else {
        setResult({ error: data.error ?? "Failed to send" })
      }
    } catch {
      setResult({ error: "Network error" })
    } finally {
      setSendLoading(false)
    }
  }, [webhookId, parsed])

  const handleSaveTemplate = useCallback(async () => {
    if (!saveName.trim() || !parsed) return
    setSaveLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/discord/webhook-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), payload: parsed }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true })
        setSaveName("")
      } else {
        setResult({ error: data.error ?? "Failed to save" })
      }
    } catch {
      setResult({ error: "Network error" })
    } finally {
      setSaveLoading(false)
    }
  }, [saveName, parsed])

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to use the embed builder.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4" />
            Embed builder
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Edit the JSON payload (content, embeds, components, allowed_mentions). Send to a stored webhook or save as template.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Payload JSON</Label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={14}
              className="font-mono text-sm resize-none"
              placeholder='{ "content": "", "embeds": [...] }'
            />
            {parseError && (
              <span className="text-sm text-destructive">{parseError}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={webhookId} onValueChange={setWebhookId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select webhook to send" />
              </SelectTrigger>
              <SelectContent>
                {storedWebhooks.map((w) => (
                  <SelectItem key={w.id} value={w.webhook_id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSend}
              disabled={!webhookId || !parsed || sendLoading}
            >
              {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-1.5">Send</span>
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Input
                placeholder="Template name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-40"
              />
              <Button
                variant="outline"
                onClick={handleSaveTemplate}
                disabled={!saveName.trim() || !parsed || saveLoading}
              >
                {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-1.5">Save template</span>
              </Button>
            </div>
          </div>
          {result?.ok && (
            <span className="text-sm text-green-600 dark:text-green-400">Done.</span>
          )}
          {result?.error && (
            <span className="text-sm text-destructive">{result.error}</span>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
