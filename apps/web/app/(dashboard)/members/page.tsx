"use client"

import React, { useEffect, useState } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { Users, ChevronDown, ChevronRight, MessageSquare, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { FlowiseAgentCard } from "@/components/flowise-mnky/flowise-agent-card"

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" })
  const json = await r.json()
  if (!r.ok) {
    const err = new Error(json.error ?? "Request failed") as Error & {
      status?: number
    }
    err.status = r.status
    throw err
  }
  return json
}

const ROLES = ["admin", "moderator", "user", "pending"] as const

interface Profile {
  id: string
  display_name: string | null
  email: string | null
  full_name: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
}

interface FlowiseAssignment {
  id: string
  chatflow_id: string
  display_name: string | null
}

interface FlowiseChatflow {
  id: string
  name?: string
  flowName?: string
}

/** Assignment with override_config for agent card (GET returns it) */
interface FlowiseAssignmentWithConfig extends FlowiseAssignment {
  override_config?: Record<string, unknown>
}

function chatflowLabel(
  assignment: FlowiseAssignment,
  chatflows: FlowiseChatflow[]
): string {
  const name =
    assignment.display_name?.trim() ||
    chatflows.find((c) => c.id === assignment.chatflow_id)?.name ||
    chatflows.find((c) => c.id === assignment.chatflow_id)?.flowName ||
    assignment.chatflow_id
  return name.length > 32 ? `${name.slice(0, 32)}…` : name
}

function MemberChatflowsCell({
  profileId,
  chatflows,
}: {
  profileId: string
  chatflows: FlowiseChatflow[]
}) {
  const { data, isLoading } = useSWR<{
    assignments: FlowiseAssignmentWithConfig[]
    defaultChatflowId: string | null
  }>(`/api/admin/members/${profileId}/chatflow-assignments`, fetcher, {
    revalidateOnFocus: false,
  })
  const assignments = data?.assignments ?? []
  const defaultChatflowId = data?.defaultChatflowId ?? null

  if (isLoading) {
    return (
      <span className="text-muted-foreground text-xs" aria-busy="true">
        …
      </span>
    )
  }

  if (assignments.length === 0) {
    return (
      <span className="text-muted-foreground text-xs">
        Expand to manage
      </span>
    )
  }

  const defaultAssignment = assignments.find(
    (a) => a.chatflow_id === defaultChatflowId
  )
  const primary = defaultAssignment ?? assignments[0]
  const primaryName = chatflowLabel(primary, chatflows)
  const restCount = assignments.length - 1
  const label =
    restCount > 0 ? `${primaryName} (+${restCount} more)` : primaryName

  const content = (
    <div className="flex min-w-0 max-w-[200px] items-center gap-1.5 text-xs">
      <span className="truncate text-muted-foreground" title={primaryName}>
        {label}
      </span>
      {defaultChatflowId === primary.chatflow_id && (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          Default
        </Badge>
      )}
    </div>
  )

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex min-w-0 max-w-full cursor-default items-center gap-1.5 rounded text-left text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {content}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="left"
        className="w-auto max-w-[360px] overflow-auto"
      >
        <div className="space-y-3">
          {assignments.map((a) => (
            <FlowiseAgentCard
              key={a.id}
              id={a.id}
              chatflowId={a.chatflow_id}
              displayName={chatflowLabel(a, chatflows) || null}
              overrideConfig={a.override_config ?? {}}
              chatHref={`/dojo/chat?chatflowId=${encodeURIComponent(a.chatflow_id)}`}
            >
              <></>
            </FlowiseAgentCard>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function MemberChatflowsRow({
  profileId,
  chatflows,
  onAssign,
  onRemove,
  onSetDefault,
  mutate,
}: {
  profileId: string
  chatflows: FlowiseChatflow[]
  onAssign: (profileId: string, chatflowId: string, setAsDefault: boolean) => void
  onRemove: (profileId: string, assignmentId: string) => void
  onSetDefault: (profileId: string, chatflowId: string) => void
  mutate: () => void
}) {
  const [assignChatflowId, setAssignChatflowId] = useState<string>("")
  const { data, isLoading, mutate: mutateAssignments } = useSWR<{
    assignments: FlowiseAssignment[]
    defaultChatflowId: string | null
  }>(`/api/admin/members/${profileId}/chatflow-assignments`, fetcher, {
    revalidateOnFocus: false,
  })
  const assignments = data?.assignments ?? []
  const defaultChatflowId = data?.defaultChatflowId ?? null
  const assignedIds = new Set(assignments.map((a) => a.chatflow_id))
  const availableChatflows = chatflows.filter((c) => c.id && !assignedIds.has(c.id))
  const label = (c: FlowiseChatflow) => (c.name ?? c.flowName ?? c.id) || c.id

  const handleAssign = () => {
    if (!assignChatflowId) return
    onAssign(profileId, assignChatflowId, assignments.length === 0)
    setAssignChatflowId("")
    mutateAssignments()
    mutate()
  }

  return (
    <tr className="border-b border-border/50 bg-muted/20">
      <td colSpan={6} className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Chatflow assignments</span>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              {assignments.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm"
                    >
                      <span>{chatflowLabel(a, chatflows)}</span>
                      {defaultChatflowId === a.chatflow_id && (
                        <Badge variant="secondary" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => onSetDefault(profileId, a.chatflow_id)}
                        disabled={defaultChatflowId === a.chatflow_id}
                      >
                        Set default
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive hover:text-destructive"
                        onClick={() => {
                          onRemove(profileId, a.id)
                          mutateAssignments()
                          mutate()
                        }}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={assignChatflowId || "__none__"}
                  onValueChange={(v) => setAssignChatflowId(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger className="w-[220px] h-8">
                    <SelectValue placeholder="Select chatflow to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select chatflow…</SelectItem>
                    {availableChatflows.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {label(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!assignChatflowId}
                  onClick={handleAssign}
                >
                  Assign
                </Button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function MembersPage() {
  const router = useRouter()
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const { data, error, isLoading, mutate } = useSWR<{ users: Profile[] }>(
    "/api/admin/users",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: chatflowsList } = useSWR<FlowiseChatflow[] | { error?: string }>(
    "/api/flowise/chatflows",
    fetcher,
    { revalidateOnFocus: false }
  )
  const chatflows = Array.isArray(chatflowsList) ? chatflowsList : []

  useEffect(() => {
    const err = error as (Error & { status?: number }) | undefined
    if (err && err.status === 403) {
      router.replace("/")
    }
  }, [error, router])

  const users = data?.users ?? []

  async function handleRoleChange(userId: string, newRole: string) {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
      credentials: "include",
    })
    if (res.ok) {
      mutate()
    } else {
      const json = await res.json()
      alert(json.error ?? "Failed to update role")
    }
  }

  async function handleAssignChatflow(profileId: string, chatflowId: string, setAsDefault: boolean) {
    const res = await fetch(`/api/admin/members/${profileId}/chatflow-assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ chatflowId, setAsDefault }),
    })
    if (!res.ok) {
      const json = await res.json()
      alert(json.error ?? "Failed to assign")
      return
    }
    mutate()
  }

  async function handleRemoveAssignment(profileId: string, assignmentId: string) {
    const res = await fetch(`/api/admin/members/${profileId}/chatflow-assignments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ assignmentId }),
    })
    if (!res.ok) {
      const json = await res.json()
      alert(json.error ?? "Failed to remove")
      return
    }
    mutate()
  }

  async function handleSetDefaultChatflow(profileId: string, chatflowId: string) {
    const res = await fetch(`/api/admin/members/${profileId}/default-chatflow`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ chatflowId }),
    })
    if (!res.ok) {
      const json = await res.json()
      alert(json.error ?? "Failed to set default")
      return
    }
    mutate()
  }

  if (error && !isLoading) {
    const status = (error as Error & { status?: number })?.status
    if (status === 403) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-muted-foreground">
            Admin access required. Redirecting...
          </p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-destructive">
          Failed to load members. {(error as Error)?.message}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Members
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage user roles. Only admins can change roles.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium text-foreground">
                No members yet
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Users will appear here after they sign up.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-8 py-3 px-2" aria-label="Expand" />
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Last sign in
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Chatflows
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <React.Fragment key={user.id}>
                      <tr
                        className="border-b border-border/50 hover:bg-muted/30"
                      >
                        <td className="py-3 px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setExpandedUserId((id) => (id === user.id ? null : user.id))
                            }
                            aria-expanded={expandedUserId === user.id}
                          >
                            {expandedUserId === user.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {user.display_name || user.full_name || "—"}
                            </span>
                            {user.role === "pending" && (
                              <Badge variant="secondary" className="text-[10px]">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {user.email || "—"}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(v) =>
                                handleRoleChange(user.id, v)
                              }
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3 px-2">
                          {expandedUserId === user.id ? (
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <MemberChatflowsCell
                              profileId={user.id}
                              chatflows={chatflows}
                            />
                          )}
                        </td>
                      </tr>
                      {expandedUserId === user.id && (
                        <MemberChatflowsRow
                          profileId={user.id}
                          chatflows={chatflows}
                          onAssign={handleAssignChatflow}
                          onRemove={handleRemoveAssignment}
                          onSetDefault={handleSetDefaultChatflow}
                          mutate={mutate}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
