"use client"

import { useState, useCallback } from "react"
import { MessageSquarePlus, Loader2 } from "lucide-react"
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
import { CHANNEL_TYPE_FORUM } from "./discord-types"

interface DiscordForumsTabProps {
  channels: Channel[]
  guildId: string
}

export function DiscordForumsTab({ channels, guildId }: DiscordForumsTabProps) {
  const [forumChannelId, setForumChannelId] = useState("")
  const [forumName, setForumName] = useState("")
  const [forumMessage, setForumMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  const forumChannels = channels.filter((c) => c.type === CHANNEL_TYPE_FORUM)

  const handleCreate = useCallback(async () => {
    if (!forumChannelId || !forumName.trim() || !forumMessage.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/discord/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: forumChannelId,
          name: forumName.trim(),
          message: forumMessage.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true })
        setForumName("")
        setForumMessage("")
      } else {
        setResult({ error: data.error ?? "Failed to create post" })
      }
    } catch {
      setResult({ error: "Network error" })
    } finally {
      setLoading(false)
    }
  }, [forumChannelId, forumName, forumMessage])

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to create forum posts.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Create forum post
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Start a new thread in a forum channel.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label>Forum channel</Label>
          <Select value={forumChannelId} onValueChange={setForumChannelId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Select forum channel" />
            </SelectTrigger>
            <SelectContent>
              {forumChannels.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Thread title (max 100 characters)</Label>
          <Input
            placeholder="Post title"
            value={forumName}
            onChange={(e) => setForumName(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="grid gap-2">
          <Label>First message (max 2000 characters)</Label>
          <Textarea
            placeholder="First message in the thread..."
            value={forumMessage}
            onChange={(e) => setForumMessage(e.target.value)}
            maxLength={2000}
            rows={3}
            className="resize-none"
          />
          <span className="text-xs text-muted-foreground">{forumMessage.length}/2000</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreate}
            disabled={
              !forumChannelId || !forumName.trim() || !forumMessage.trim() || loading
            }
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-4 w-4" />
            )}
            <span className="ml-1.5">Create post</span>
          </Button>
          {result?.ok && (
            <span className="text-sm text-green-600 dark:text-green-400">Created.</span>
          )}
          {result?.error && (
            <span className="text-sm text-destructive">{result.error}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
