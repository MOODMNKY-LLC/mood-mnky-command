"use client"

import { useState, useCallback } from "react"
import { Send, Loader2 } from "lucide-react"
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
import type { Channel } from "./discord-types"
import { CHANNEL_TYPE_FORUM } from "./discord-types"

interface DiscordMessagesTabProps {
  channels: Channel[]
  guildId: string
}

export function DiscordMessagesTab({ channels, guildId }: DiscordMessagesTabProps) {
  const [sendChannelId, setSendChannelId] = useState("")
  const [sendContent, setSendContent] = useState("")
  const [sendLoading, setSendLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  const textChannels = channels.filter((c) => c.type !== CHANNEL_TYPE_FORUM)

  const handleSend = useCallback(async () => {
    if (!sendChannelId || !sendContent.trim()) return
    setSendLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/discord/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: sendChannelId, content: sendContent.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true })
        setSendContent("")
      } else {
        setResult({ error: data.error ?? "Failed to send" })
      }
    } catch {
      setResult({ error: "Network error" })
    } finally {
      setSendLoading(false)
    }
  }, [sendChannelId, sendContent])

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to send messages.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" />
          Send message
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Post a message to a text channel. Mentions are disabled by default.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label>Channel</Label>
          <Select value={sendChannelId} onValueChange={setSendChannelId}>
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
          <Label>Message (max 2000 characters)</Label>
          <Textarea
            placeholder="Type your message..."
            value={sendContent}
            onChange={(e) => setSendContent(e.target.value)}
            maxLength={2000}
            rows={3}
            className="resize-none"
          />
          <span className="text-xs text-muted-foreground">{sendContent.length}/2000</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSend}
            disabled={!sendChannelId || !sendContent.trim() || sendLoading}
          >
            {sendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-1.5">Send</span>
          </Button>
          {result?.ok && (
            <span className="text-sm text-green-600 dark:text-green-400">Sent.</span>
          )}
          {result?.error && (
            <span className="text-sm text-destructive">{result.error}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
