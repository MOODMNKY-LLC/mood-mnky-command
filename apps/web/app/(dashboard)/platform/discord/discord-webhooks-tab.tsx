"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Webhook, Plus, Trash2, Send, Loader2, Link2, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Channel } from "./discord-types"

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

interface DiscordWebhooksTabProps {
  channels: Channel[]
  guildId: string
}

export function DiscordWebhooksTab({ channels, guildId }: DiscordWebhooksTabProps) {
  const [createChannelId, setCreateChannelId] = useState("")
  const [createName, setCreateName] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [executeWebhookId, setExecuteWebhookId] = useState("")
  const [executeContent, setExecuteContent] = useState("")
  const [executeLoading, setExecuteLoading] = useState(false)
  const [createResult, setCreateResult] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [executeResult, setExecuteResult] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [importUrl, setImportUrl] = useState("")
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const { data: storedData, mutate: mutateStored } = useSWR<{ webhooks?: StoredWebhook[] }>(
    guildId ? `/api/discord/webhooks/stored?guildId=${guildId}` : null,
    fetcher
  )
  const { data: guildWebhooksData } = useSWR<{ webhooks?: { id: string; channel_id?: string; guild_id?: string; name: string; avatar: string | null }[] }>(
    guildId ? `/api/discord/webhooks?guildId=${guildId}` : null,
    fetcher
  )
  const storedWebhooks = storedData?.webhooks ?? []
  const guildWebhooks = guildWebhooksData?.webhooks ?? []

  const textChannels = channels.filter((c) => c.type !== 15)
  const channelById = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels])

  const handleCreate = useCallback(async () => {
    if (!createChannelId || !createName.trim()) return
    setCreateLoading(true)
    setCreateResult(null)
    try {
      const res = await fetch("/api/discord/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: createChannelId, name: createName.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreateResult({ ok: true })
        setCreateName("")
        mutateStored()
      } else {
        setCreateResult({ error: data.error ?? "Failed to create webhook" })
      }
    } catch {
      setCreateResult({ error: "Network error" })
    } finally {
      setCreateLoading(false)
    }
  }, [createChannelId, createName, mutateStored])

  const handleExecute = useCallback(async () => {
    if (!executeWebhookId) return
    setExecuteLoading(true)
    setExecuteResult(null)
    try {
      const res = await fetch("/api/discord/webhooks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookId: executeWebhookId, // Discord webhook_id
          content: executeContent.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setExecuteResult({ ok: true })
        setExecuteContent("")
        mutateStored()
      } else {
        setExecuteResult({ error: data.error ?? "Failed to execute" })
      }
    } catch {
      setExecuteResult({ error: "Network error" })
    } finally {
      setExecuteLoading(false)
    }
  }, [executeWebhookId, executeContent, mutateStored])

  const handleDelete = useCallback(
    async (webhookId: string) => {
      if (!confirm("Delete this stored webhook? The webhook will be removed from Discord and from storage.")) return
      try {
        const res = await fetch(`/api/discord/webhooks/${webhookId}`, { method: "DELETE" })
        if (res.ok) mutateStored()
      } catch {
        setCreateResult({ error: "Failed to delete" })
      }
    },
    [mutateStored]
  )

  const handleImport = useCallback(async () => {
    const url = importUrl.trim()
    if (!url) return
    setImportLoading(true)
    setImportResult(null)
    try {
      const res = await fetch("/api/discord/webhooks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult({ ok: true })
        setImportUrl("")
        mutateStored()
      } else {
        setImportResult({ error: data.error ?? "Failed to import" })
      }
    } catch {
      setImportResult({ error: "Network error" })
    } finally {
      setImportLoading(false)
    }
  }, [importUrl, mutateStored])

  const handleCopyUrl = useCallback(async (webhookId: string) => {
    setCopyFeedback(null)
    try {
      const res = await fetch(`/api/discord/webhooks/${webhookId}/url`)
      const data = await res.json()
      if (!res.ok) {
        setCopyFeedback(data.error ?? "Failed to get URL")
        return
      }
      if (typeof data.url === "string") {
        await navigator.clipboard.writeText(data.url)
        setCopyFeedback("Copied!")
        setTimeout(() => setCopyFeedback(null), 2000)
      }
    } catch {
      setCopyFeedback("Failed to copy")
    }
  }, [])

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to manage webhooks.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create webhook
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Create a webhook in a channel. The token is stored encrypted and used for &quot;Execute&quot; only.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Channel</Label>
            <Select value={createChannelId} onValueChange={setCreateChannelId}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {textChannels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Webhook name (1–80 chars)</Label>
            <Input
              placeholder="e.g. LABZ Announcements"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={80}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!createChannelId || !createName.trim() || createLoading}
          >
            {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
            <span className="ml-1.5">Create & store</span>
          </Button>
          {createResult?.ok && (
            <span className="text-sm text-green-600 dark:text-green-400">Webhook created and stored.</span>
          )}
          {createResult?.error && (
            <span className="text-sm text-destructive">{createResult.error}</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Import webhook by URL
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Paste a webhook URL from Discord (channel settings). Token is stored encrypted and the webhook appears in Execute.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://discord.com/api/webhooks/123456789/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <Button
            onClick={handleImport}
            disabled={!importUrl.trim() || importLoading}
          >
            {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            <span className="ml-1.5">Import & store</span>
          </Button>
          {importResult?.ok && (
            <span className="text-sm text-green-600 dark:text-green-400">Webhook imported and stored.</span>
          )}
          {importResult?.error && (
            <span className="text-sm text-destructive">{importResult.error}</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            Execute webhook (test send)
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Use a stored webhook to send a message. Token is never exposed.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Stored webhook</Label>
            <Select value={executeWebhookId} onValueChange={setExecuteWebhookId}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select webhook" />
              </SelectTrigger>
              <SelectContent>
                {storedWebhooks.map((w) => (
                  <SelectItem key={w.id} value={w.webhook_id}>
                    {w.name} ({w.webhook_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Message content (optional; use Embed Builder for embeds)</Label>
            <Textarea
              placeholder="Text content..."
              value={executeContent}
              onChange={(e) => setExecuteContent(e.target.value)}
              maxLength={2000}
              rows={2}
              className="resize-none"
            />
          </div>
          <Button
            onClick={handleExecute}
            disabled={!executeWebhookId || executeLoading}
          >
            {executeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-1.5">Send</span>
          </Button>
          {executeResult?.ok && (
            <span className="text-sm text-green-600 dark:text-green-400">Sent.</span>
          )}
          {executeResult?.error && (
            <span className="text-sm text-destructive">{executeResult.error}</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stored webhooks</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Webhooks stored in LABZ for this server (used in Execute dropdown). Delete here also removes from Discord.
          </p>
        </CardHeader>
        <CardContent>
          {storedWebhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stored webhooks. Create one above to use Execute.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {storedWebhooks.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{w.name}</span>
                    <span className="text-muted-foreground shrink-0">#{w.webhook_id}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copy webhook URL"
                        onClick={() => handleCopyUrl(w.webhook_id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(w.webhook_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {copyFeedback && (
                <p className="text-sm text-muted-foreground mt-1">{copyFeedback}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing webhooks on Discord</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            All webhooks on this server (from Discord). Only stored webhooks can be used for Execute. Create a webhook above to add it to stored.
          </p>
        </CardHeader>
        <CardContent>
          {guildWebhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No webhooks on this server, or failed to load.</p>
          ) : (
            <ul className="space-y-2">
              {guildWebhooks.map((w) => {
                const channelName = w.channel_id ? channelById.get(w.channel_id)?.name ?? w.channel_id : "—"
                const isStored = storedWebhooks.some((s) => s.webhook_id === w.id)
                return (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <span>{w.name}</span>
                    <span className="text-muted-foreground shrink-0">#{channelName}</span>
                    {isStored ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copy webhook URL"
                        onClick={() => handleCopyUrl(w.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">Not stored (no token)</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
