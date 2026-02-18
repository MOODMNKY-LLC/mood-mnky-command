"use client"

import { useState } from "react"
import useSWR from "swr"
import { FileText, Loader2 } from "lucide-react"
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AuditLogEntry {
  id: string
  user_id?: string
  action_type: number
  target_id?: string
  changes?: unknown[]
  reason?: string
  options?: Record<string, unknown>
  created_at: string
}

interface DiscordAuditLogsTabProps {
  guildId: string
}

const ACTION_NAMES: Record<number, string> = {
  1: "Guild update",
  10: "Channel create",
  11: "Channel update",
  12: "Channel delete",
  13: "Channel overwrite create",
  14: "Channel overwrite update",
  15: "Channel overwrite delete",
  20: "Member kick",
  21: "Member prune",
  22: "Member ban add",
  23: "Member ban remove",
  24: "Member update",
  25: "Member role update",
  26: "Member move",
  27: "Member disconnect",
  28: "Bot add",
  30: "Role create",
  31: "Role update",
  32: "Role delete",
  40: "Invite create",
  41: "Invite update",
  42: "Invite delete",
  50: "Webhook create",
  51: "Webhook update",
  52: "Webhook delete",
  60: "Emoji create",
  61: "Emoji update",
  62: "Emoji delete",
  72: "Message delete",
}

function actionName(type: number): string {
  return ACTION_NAMES[type] ?? `Action ${type}`
}

export function DiscordAuditLogsTab({ guildId }: DiscordAuditLogsTabProps) {
  const [limit, setLimit] = useState("50")
  const [actionType, setActionType] = useState("")
  const [userId, setUserId] = useState("")

  const params = new URLSearchParams()
  if (guildId) params.set("guildId", guildId)
  params.set("limit", limit)
  if (actionType) params.set("action_type", actionType)
  if (userId.trim()) params.set("user_id", userId.trim())

  const { data, error, isLoading, mutate } = useSWR<{ audit_log_entries?: AuditLogEntry[] }>(
    guildId ? `/api/discord/audit-logs?${params.toString()}` : null,
    fetcher
  )

  const entries = data?.audit_log_entries ?? []

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to view audit logs.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Audit logs
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          View server audit log. Filter by action type or user.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid gap-1">
            <Label className="text-xs">Limit</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Action type</Label>
            <Input
              placeholder="e.g. 22"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-24"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">User ID</Label>
            <Input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-36"
            />
          </div>
          <Button variant="secondary" onClick={() => mutate()} className="self-end">
            Refresh
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">
            {(error as { message?: string })?.message ?? "Failed to load audit log"}
          </p>
        )}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="rounded-md border divide-y max-h-[500px] overflow-y-auto">
            {entries.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No entries.</div>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{actionName(e.action_type)}</span>
                    <span className="text-muted-foreground text-xs">
                      {e.created_at ? new Date(e.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  {e.user_id && (
                    <div className="text-muted-foreground">User: {e.user_id}</div>
                  )}
                  {e.target_id && (
                    <div className="text-muted-foreground">Target: {e.target_id}</div>
                  )}
                  {e.reason && (
                    <div className="text-muted-foreground">Reason: {e.reason}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
