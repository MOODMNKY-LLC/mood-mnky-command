"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Database,
  Table2,
  Key,
  Shield,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Column {
  name: string
  type: string
  default_value: string | null
  is_nullable: boolean
  is_identity: boolean
  is_unique: boolean
  comment: string | null
}

interface Policy {
  id: number
  name: string
  command: string
  definition: string
  check: string | null
  roles: string[]
}

interface TableData {
  name: string
  schema: string
  comment: string | null
  columns: Column[]
  rls_enabled: boolean
  primary_keys: { name: string }[]
  relationships: Array<{
    source_column_name: string
    target_table_name: string
    target_column_name: string
  }>
  policies?: Policy[]
}

export default function TablesPage() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [schema, setSchema] = useState("public")

  const { data, isLoading } = useSWR(
    `/api/platform/tables?schema=${schema}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const tables: TableData[] = data?.tables || []
  const filtered = tables.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )
  const active = tables.find((t) => t.name === selectedTable)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/platform">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Platform
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Table Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse database schemas, columns, and RLS policies
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Table List */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter tables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <select
              value={schema}
              onChange={(e) => {
                setSchema(e.target.value)
                setSelectedTable(null)
              }}
              className="h-9 rounded-md border border-input bg-card px-2 text-xs text-foreground"
            >
              <option value="public">public</option>
              <option value="auth">auth</option>
              <option value="storage">storage</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col gap-1 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-md" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No tables found
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 p-1.5">
                  {filtered.map((table) => (
                    <button
                      key={table.name}
                      type="button"
                      onClick={() => setSelectedTable(table.name)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        selectedTable === table.name
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Table2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono text-xs truncate">
                        {table.name}
                      </span>
                      {table.rls_enabled && (
                        <Shield className="h-3 w-3 text-success ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Table Detail */}
        <div className="flex-1 min-w-0">
          {!active ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Database className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-medium text-foreground">
                  Select a table
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a table from the sidebar to view its schema
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Table Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold font-mono text-foreground">
                        {active.schema}.{active.name}
                      </h2>
                      <Badge
                        className={`text-[10px] border-0 ${
                          active.rls_enabled
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        RLS {active.rls_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{active.columns.length} columns</span>
                      {active.policies && active.policies.length > 0 && (
                        <>
                          <span>|</span>
                          <span>{active.policies.length} policies</span>
                        </>
                      )}
                    </div>
                  </div>
                  {active.comment && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {active.comment}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Columns */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Columns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                          <th className="text-left pb-2 pr-4">Name</th>
                          <th className="text-left pb-2 pr-4">Type</th>
                          <th className="text-left pb-2 pr-4">Default</th>
                          <th className="text-center pb-2 pr-4">Nullable</th>
                          <th className="text-center pb-2">Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.columns.map((col) => {
                          const isPk = active.primary_keys.some(
                            (pk) => pk.name === col.name
                          )
                          const isFk = active.relationships.some(
                            (r) => r.source_column_name === col.name
                          )
                          return (
                            <tr
                              key={col.name}
                              className="border-b border-border/50 last:border-0"
                            >
                              <td className="py-2 pr-4">
                                <span className="font-mono text-xs text-foreground">
                                  {col.name}
                                </span>
                              </td>
                              <td className="py-2 pr-4">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {col.type}
                                </span>
                              </td>
                              <td className="py-2 pr-4">
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {col.default_value || "-"}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-center">
                                <span
                                  className={`text-xs ${
                                    col.is_nullable
                                      ? "text-muted-foreground"
                                      : "text-foreground font-medium"
                                  }`}
                                >
                                  {col.is_nullable ? "YES" : "NO"}
                                </span>
                              </td>
                              <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {isPk && (
                                    <Badge className="bg-chart-4/10 text-chart-4 border-0 text-[9px] px-1.5">
                                      <Key className="h-2.5 w-2.5 mr-0.5" />
                                      PK
                                    </Badge>
                                  )}
                                  {isFk && (
                                    <Badge className="bg-primary/10 text-primary border-0 text-[9px] px-1.5">
                                      <LinkIcon className="h-2.5 w-2.5 mr-0.5" />
                                      FK
                                    </Badge>
                                  )}
                                  {col.is_unique && !isPk && (
                                    <Badge variant="secondary" className="text-[9px] px-1.5">
                                      UQ
                                    </Badge>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Relationships */}
              {active.relationships.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Relationships
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      {active.relationships.map((rel, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs font-mono"
                        >
                          <span className="text-foreground">
                            {rel.source_column_name}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-primary">
                            {rel.target_table_name}.{rel.target_column_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RLS Policies */}
              {active.policies && active.policies.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="h-3.5 w-3.5 text-success" />
                      RLS Policies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {active.policies.map((policy) => (
                        <div
                          key={policy.id}
                          className="rounded-lg border border-border bg-secondary/30 p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-foreground">
                              {policy.name}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {policy.command}
                            </Badge>
                          </div>
                          {policy.definition && (
                            <pre className="text-xs font-mono text-muted-foreground bg-background rounded p-2 overflow-x-auto">
                              {policy.definition}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
