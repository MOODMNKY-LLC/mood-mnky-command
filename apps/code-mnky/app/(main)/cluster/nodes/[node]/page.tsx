import Link from "next/link"
import { notFound } from "next/navigation"
import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { isProxmoxConfigured, getNodeStatus, getClusterResources, formatUptime } from "@/lib/proxmox/client"
import { Cpu, HardDrive, ArrowLeft, Clock } from "lucide-react"

function StatusPill({ status }: { status: string }) {
  const ok = status === "online" || status === "running"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        ok
          ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }`}
    >
      {status}
    </span>
  )
}

type PageProps = { params: Promise<{ node: string }> }

export default async function NodePage({ params }: PageProps) {
  const { node } = await params
  if (!node) notFound()

  const configured = isProxmoxConfigured()
  if (!configured) {
    return (
      <>
        <AgentNav />
        <main className="main-container w-full flex-1 py-12">
          <Card className="main-glass-panel-card border-border/50 max-w-xl">
            <CardHeader>
              <CardTitle>Proxmox cluster</CardTitle>
              <CardDescription>
                Cluster dashboard is not configured. Set PROXMOX_BASE_URL and PROXMOX_API_TOKEN.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <AgentFooter />
      </>
    )
  }

  let nodeStatus: Awaited<ReturnType<typeof getNodeStatus>> | null = null
  let guests: Awaited<ReturnType<typeof getClusterResources>> = []

  try {
    ;[nodeStatus, guests] = await Promise.all([
      getNodeStatus(node),
      getClusterResources(),
    ])
  } catch {
    notFound()
  }

  const nodeGuests = guests.filter((g) => g.node === node)
  const memTotalGb = nodeStatus?.maxmem
    ? Math.round(nodeStatus.maxmem / 1024 / 1024 / 1024)
    : null
  const memUsedGb = nodeStatus?.mem
    ? Math.round(nodeStatus.mem / 1024 / 1024 / 1024)
    : null
  const cpuPct = nodeStatus?.cpu != null ? (nodeStatus.cpu * 100).toFixed(1) : null

  return (
    <>
      <AgentNav />
      <main className="main-container w-full flex-1 py-12 md:py-16">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cluster" className="flex items-center gap-1">
              <ArrowLeft className="size-4" /> Cluster
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {node}
          </h1>
          <p className="text-muted-foreground">
            Node detail — resources and guests
            {nodeGuests.length > 0 ? ` · ${nodeGuests.length} guest${nodeGuests.length === 1 ? "" : "s"}` : ""}.
          </p>
        </div>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="size-4 text-primary" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPill status={nodeStatus?.status ?? "unknown"} />
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">CPU</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{cpuPct ?? "—"}%</p>
              <p className="text-xs text-muted-foreground">usage</p>
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="size-4 text-primary" />
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {memUsedGb != null && memTotalGb != null
                  ? `${memUsedGb} / ${memTotalGb} GB`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">used / total</p>
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {formatUptime(nodeStatus?.uptime)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Guests on this node</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/cluster/guests?node=${encodeURIComponent(node)}`}>
                View in guests list →
              </Link>
            </Button>
          </div>
          {nodeGuests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No guests on this node.</p>
          ) : (
            <ul className="space-y-2">
              {nodeGuests.map((g) => (
                <li key={`${g.node}-${g.vmid}`}>
                  <Link
                    href={`/cluster/guests/${encodeURIComponent(g.node)}/${g.vmid}`}
                    className="block rounded-lg border border-border/50 p-4 transition-colors hover:border-primary/30 main-glass-panel-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{g.name || `VM ${g.vmid}`}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {g.type} · {g.vmid}
                        </span>
                      </div>
                      <StatusPill status={g.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {g.maxcpu ?? 0} cores · {(g.maxmem ?? 0) / 1024 / 1024} MB
                      {g.storage ? ` · ${g.storage}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <AgentFooter />
    </>
  )
}
