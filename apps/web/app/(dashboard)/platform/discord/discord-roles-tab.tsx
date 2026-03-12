"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Shield, Plus, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Role {
  id: string
  name: string
  color: number
  position: number
  permissions: string
  hoist?: boolean
  mentionable?: boolean
}

interface DiscordRolesTabProps {
  guildId: string
}

export function DiscordRolesTab({ guildId }: DiscordRolesTabProps) {
  const [name, setName] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  const { data: rolesData, mutate } = useSWR<{ roles?: Role[] }>(
    guildId ? `/api/discord/roles?guildId=${guildId}` : null,
    fetcher
  )
  const roles = rolesData?.roles ?? []

  const handleCreate = useCallback(async () => {
    if (!guildId || !name.trim()) return
    setCreateLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/discord/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, name: name.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true })
        setName("")
        mutate()
      } else {
        setResult({ error: data.error ?? "Failed to create role" })
      }
    } catch {
      setResult({ error: "Network error" })
    } finally {
      setCreateLoading(false)
    }
  }, [guildId, name, mutate])

  const handleDelete = useCallback(
    async (roleId: string) => {
      if (!guildId || !confirm("Delete this role? This cannot be undone.")) return
      try {
        const res = await fetch(`/api/discord/roles/${roleId}?guildId=${guildId}`, {
          method: "DELETE",
        })
        if (res.ok) mutate()
      } catch {
        setResult({ error: "Failed to delete" })
      }
    },
    [guildId, mutate]
  )

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to manage roles.
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
            Create role
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Create a new role. Edit permissions in Discord if needed.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Role name</Label>
            <Input
              placeholder="New role name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createLoading}
          >
            {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-1.5">Create</span>
          </Button>
          {result?.ok && (
            <span className="text-sm text-green-600 dark:text-green-400">Role created.</span>
          )}
          {result?.error && (
            <span className="text-sm text-destructive">{result.error}</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Server roles. Delete only if you are sure (hierarchy applies).
          </p>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles or loading...</p>
          ) : (
            <ul className="space-y-2">
              {roles.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span
                    className="font-medium"
                    style={r.color ? { color: `#${r.color.toString(16).padStart(6, "0")}` } : undefined}
                  >
                    {r.name}
                  </span>
                  <span className="text-muted-foreground">pos {r.position}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
