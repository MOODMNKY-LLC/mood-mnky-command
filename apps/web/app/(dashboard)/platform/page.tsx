"use client"

import useSWR from "swr"
import {
  Server,
  Database,
  Shield,
  Users,
  HardDrive,
  Activity,
  Globe,
  Clock,
  MessageSquare,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PlatformPage() {
  const { data: projectData, isLoading: projectsLoading } = useSWR(
    "/api/platform/projects",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: dbStats, isLoading: statsLoading } = useSWR(
    "/api/platform/sql",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: tablesData, isLoading: tablesLoading } = useSWR(
    "/api/platform/tables",
    fetcher,
    { revalidateOnFocus: false }
  )

  const currentProject = projectData?.currentProject
  const allProjects = projectData?.projects || []
  const tables = tablesData?.tables || []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Platform
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Supabase project management and database tools
        </p>
      </div>

      {/* Current Project */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-primary" />
            Current Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : currentProject ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-foreground">
                  {currentProject.name}
                </h3>
                <Badge
                  className={
                    currentProject.status === "ACTIVE_HEALTHY"
                      ? "bg-success/10 text-success border-0"
                      : "bg-warning/10 text-warning border-0"
                  }
                >
                  {currentProject.status === "ACTIVE_HEALTHY"
                    ? "Healthy"
                    : currentProject.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Region:</span>
                  <span className="text-foreground font-mono text-xs">
                    {currentProject.region}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Ref:</span>
                  <span className="text-foreground font-mono text-xs">
                    {currentProject.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">DB Version:</span>
                  <span className="text-foreground font-mono text-xs">
                    {currentProject.database?.version || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-foreground text-xs">
                    {new Date(currentProject.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : projectData?.error ? (
            <p className="text-sm text-destructive">{projectData.error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No project found</p>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                DB Size
              </span>
              {statsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <span className="text-2xl font-semibold text-foreground">
                  {dbStats?.db_size || "N/A"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Tables
              </span>
              {statsLoading ? (
                <Skeleton className="h-7 w-8" />
              ) : (
                <span className="text-2xl font-semibold text-foreground">
                  {dbStats?.table_count ?? "N/A"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Connections
              </span>
              {statsLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-semibold text-foreground">
                  {dbStats?.active_connections ?? 0}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{dbStats?.max_connections ?? 0}
                  </span>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Roles
              </span>
              {statsLoading ? (
                <Skeleton className="h-7 w-8" />
              ) : (
                <span className="text-2xl font-semibold text-foreground">
                  {dbStats?.role_count ?? "N/A"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/platform/tables">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Table Editor
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Browse schemas, columns, and RLS policies
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/platform/sql">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <Activity className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    SQL Editor
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Run queries with AI assistance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/platform/tables">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                  <Shield className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    RLS Policies
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    View row-level security per table
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/platform/discord">
          <Card className="cursor-pointer transition-colors hover:border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                  <MessageSquare className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Discord
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    MNKY VERSE bot: send messages, create forum posts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Tables Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Public Tables
            </div>
            {!tablesLoading && (
              <Badge variant="secondary" className="text-xs">
                {tables.length} tables
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tablesLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : tables.length > 0 ? (
            <div className="flex flex-col">
              <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
                <span>Table</span>
                <span>Columns</span>
                <span>RLS</span>
                <span>Policies</span>
              </div>
              {tables.map(
                (table: {
                  name: string
                  columns: unknown[]
                  rls_enabled: boolean
                  policies?: unknown[]
                }) => (
                  <div
                    key={table.name}
                    className="grid grid-cols-4 gap-4 py-2.5 border-b border-border/50 last:border-0 text-sm"
                  >
                    <span className="font-mono text-xs text-foreground">
                      {table.name}
                    </span>
                    <span className="text-muted-foreground">
                      {table.columns.length}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`w-fit text-[10px] ${
                        table.rls_enabled
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {table.rls_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {table.policies?.length || 0}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : tablesData?.error ? (
            <p className="text-sm text-destructive">{tablesData.error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No tables found</p>
          )}
        </CardContent>
      </Card>

      {/* All Projects */}
      {allProjects.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              All Projects
              <Badge variant="secondary" className="text-xs">
                {allProjects.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {allProjects.map(
                (project: {
                  id: string
                  name: string
                  region: string
                  status: string
                }) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          project.status === "ACTIVE_HEALTHY"
                            ? "bg-success"
                            : "bg-warning"
                        }`}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {project.name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {project.id}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {project.region}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
