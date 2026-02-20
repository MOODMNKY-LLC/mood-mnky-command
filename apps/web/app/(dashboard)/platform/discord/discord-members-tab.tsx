"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Users, Search, Loader2 } from "lucide-react"
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

interface Member {
  user?: { id: string; username: string; discriminator?: string; avatar: string | null }
  nick?: string | null
  roles: string[]
  joined_at: string
}

interface Role {
  id: string
  name: string
  color: number
  position: number
}

interface DiscordMembersTabProps {
  guildId: string
}

export function DiscordMembersTab({ guildId }: DiscordMembersTabProps) {
  const [query, setQuery] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [addRoleId, setAddRoleId] = useState("")
  const [roleLoading, setRoleLoading] = useState(false)

  const listUrl = guildId
    ? `/api/discord/members?guildId=${guildId}&limit=100`
    : null
  const searchUrl =
    guildId && searchQuery.trim()
      ? `/api/discord/members?guildId=${guildId}&query=${encodeURIComponent(searchQuery.trim())}&limit=50`
      : null
  const { data: listData, mutate: mutateList } = useSWR<{ members?: Member[] }>(
    searchQuery.trim() ? null : listUrl,
    fetcher
  )
  const { data: searchData } = useSWR<{ members?: Member[] }>(
    searchUrl,
    fetcher
  )
  const { data: rolesData } = useSWR<{ roles?: Role[] }>(
    guildId ? `/api/discord/roles?guildId=${guildId}` : null,
    fetcher
  )

  const members = searchQuery.trim()
    ? (searchData?.members ?? [])
    : (listData?.members ?? [])
  const roles = rolesData?.roles ?? []

  const handleAddRole = useCallback(
    async (userId: string, roleId: string) => {
      if (!guildId || !roleId) return
      setRoleLoading(true)
      try {
        const res = await fetch(
          `/api/discord/members/${userId}/roles/${roleId}`,
          { method: "PUT" }
        )
        if (res.ok) mutateList()
      } finally {
        setRoleLoading(false)
      }
    },
    [guildId, mutateList]
  )

  const handleRemoveRole = useCallback(
    async (userId: string, roleId: string) => {
      if (!guildId) return
      setRoleLoading(true)
      try {
        const res = await fetch(
          `/api/discord/members/${userId}/roles/${roleId}`,
          { method: "DELETE" }
        )
        if (res.ok) mutateList()
      } finally {
        setRoleLoading(false)
      }
    },
    [guildId, mutateList]
  )

  if (!guildId) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Select a server above to view members. Requires GUILD_MEMBERS privileged intent.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            List and search members; assign or remove roles.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearchQuery(query)}
              className="max-w-xs"
            />
            <Button variant="secondary" onClick={() => setSearchQuery(query)}>
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
            {searchQuery && (
              <Button variant="ghost" onClick={() => { setSearchQuery(""); setQuery(""); }}>
                Clear
              </Button>
            )}
          </div>
          <div className="rounded-md border divide-y max-h-[400px] overflow-y-auto">
            {members.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No members found. Enable GUILD_MEMBERS intent if list is empty.
              </div>
            ) : (
              members.map((m) => {
                const uid = m.user?.id ?? ""
                const displayName = m.nick ?? m.user?.username ?? uid
                return (
                  <div
                    key={uid}
                    className="flex items-center justify-between gap-2 p-3 hover:bg-muted/50"
                  >
                    <div>
                      <span className="font-medium">{displayName}</span>
                      {m.user?.username && m.user.username !== displayName && (
                        <span className="text-muted-foreground text-sm ml-1">
                          @{m.user.username}
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs ml-1">
                        {m.roles.length} role(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={addRoleId}
                        onValueChange={(roleId) => {
                          setAddRoleId(roleId)
                          setSelectedUserId(uid)
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Add role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles
                            .filter((r) => !m.roles.includes(r.id))
                            .map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {selectedUserId === uid && addRoleId && (
                        <Button
                          size="sm"
                          disabled={roleLoading}
                          onClick={() => {
                            handleAddRole(uid, addRoleId)
                            setAddRoleId("")
                            setSelectedUserId(null)
                          }}
                        >
                          {roleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
