"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

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

export default function MembersPage() {
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR<{ users: Profile[] }>(
    "/api/admin/users",
    fetcher,
    { revalidateOnFocus: false }
  )

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
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
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
                    </tr>
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
