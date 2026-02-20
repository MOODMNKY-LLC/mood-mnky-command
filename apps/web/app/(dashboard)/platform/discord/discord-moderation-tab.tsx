"use client"

import { useState, useCallback } from "react"
import { ShieldAlert, Loader2 } from "lucide-react"
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

interface DiscordModerationTabProps {
  guildId: string
}

type Action = "timeout" | "kick" | "ban" | "unban"

export function DiscordModerationTab({ guildId }: DiscordModerationTabProps) {
  const [action, setAction] = useState<Action>("timeout")
  const [userId, setUserId] = useState("")
  const [reason, setReason] = useState("")
  const [timeoutMinutes, setTimeoutMinutes] = useState("60")
  const [deleteMessageDays, setDeleteMessageDays] = useState("0")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!guildId || !userId.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const body: Record<string, unknown> = {
        action,
        guildId,
        userId: userId.trim(),
        auditLogReason: reason.trim() || undefined,
      }
      if (action === "timeout") {
        const mins = Math.min(40320, Math.max(0, parseInt(timeoutMinutes, 10) || 0))
        if (mins > 0) {
          const until = new Date(Date.now() + mins * 60 * 1000).toISOString()
          body.communication_disabled_until = until
        } else {
          body.communication_disabled_until = null
        }
      }
      if (action === "ban") {
        const days = Math.min(7, Math.max(0, parseInt(deleteMessageDays, 10) || 0))
        body.delete_message_seconds = days * 24 * 60 * 60
      }
      const res = await fetch("/api/discord/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true })
        setUserId("")
        setReason("")
      } else {
        setResult({ error: data.error ?? "Failed" })
      }
    } catch {
      setResult({ error: "Network error" })
    } finally {
      setLoading(false)
    }
  }, [action, guildId, userId, reason, timeoutMinutes, deleteMessageDays])

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to use moderation actions.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          Moderation
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Timeout, kick, ban, or unban a user. Use Discord user ID (Developer Mode → right-click user → Copy ID).
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label>Action</Label>
          <Select value={action} onValueChange={(v) => setAction(v as Action)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timeout">Timeout</SelectItem>
              <SelectItem value="kick">Kick</SelectItem>
              <SelectItem value="ban">Ban</SelectItem>
              <SelectItem value="unban">Unban</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>User ID (snowflake)</Label>
          <Input
            placeholder="Discord user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        {action === "timeout" && (
          <div className="grid gap-2">
            <Label>Timeout duration (minutes, 0 = remove timeout)</Label>
            <Input
              type="number"
              min={0}
              max={40320}
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(e.target.value || "0")}
            />
          </div>
        )}
        {action === "ban" && (
          <div className="grid gap-2">
            <Label>Delete message history (days, 0–7)</Label>
            <Input
              type="number"
              min={0}
              max={7}
              value={deleteMessageDays}
              onChange={(e) => setDeleteMessageDays(e.target.value || "0")}
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label>Audit log reason (optional)</Label>
          <Textarea
            placeholder="Reason for audit log"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={512}
            rows={2}
            className="resize-none"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!userId.trim() || loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          <span className="ml-1.5">{action}</span>
        </Button>
        {result?.ok && (
          <span className="text-sm text-green-600 dark:text-green-400">Done.</span>
        )}
        {result?.error && (
          <span className="text-sm text-destructive">{result.error}</span>
        )}
      </CardContent>
    </Card>
  )
}
