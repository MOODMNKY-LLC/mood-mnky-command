import Link from "next/link"
import { notFound } from "next/navigation"
import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  isProxmoxConfigured,
  getClusterResources,
  getGuestStatus,
  formatUptime,
  formatBytes,
} from "@/lib/proxmox/client"
import { ArrowLeft, Cpu, HardDrive, Server, Clock, Network } from "lucide-react"

function StatusPill({ status }: { status: string }) {
  const ok = status === "running"
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

type PageProps = { params: Promise<{ node: string; vmid: string }> }

export default async function GuestDetailPage({ params }: PageProps) {
  const { node, vmid } = await params
  if (!node || !vmid) notFound()

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
                Cluster dashboard is not configured.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <AgentFooter />
      </>
    )
  }

  let guests: Awaited<ReturnType<typeof getClusterResources>> = []
  try {
    guests = await getClusterResources()
  } catch {
    notFound()
  }

  const guest = guests.find((g) => g.node === node && String(g.vmid) === vmid)
  if (!guest) notFound()

  let currentStatus: Awaited<ReturnType<typeof getGuestStatus>> | null = null
  try {
    currentStatus = await getGuestStatus(node, vmid, guest.type)
  } catch {
    // use guest from list as fallback
  }

  const status = currentStatus?.status ?? guest.status
  const memUsed = currentStatus?.mem ?? guest.mem
  const memTotal = currentStatus?.maxmem ?? guest.maxmem
  const memUsedMb = memUsed != null ? Math.round(memUsed / 1024 / 1024) : null
  const memTotalMb = memTotal != null ? Math.round(memTotal / 1024 / 1024) : null
  const diskUsed = guest.disk
  const diskTotal = guest.maxdisk
  const cpuPct =
    currentStatus?.cpu != null
      ? (currentStatus.cpu * 100).toFixed(1)
      : guest.cpu != null
        ? (guest.cpu * 100).toFixed(1)
        : null
  const uptime = currentStatus?.uptime
  const netin = currentStatus?.netin
  const netout = currentStatus?.netout
  const cpus = currentStatus?.cpus ?? guest.maxcpu

  return (
    <>
      <AgentNav />
      <main className="main-container w-full flex-1 py-12 md:py-16">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cluster/guests" className="flex items-center gap-1">
              <ArrowLeft className="size-4" /> Guests
            </Link>
          </Button>
        </div>

        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {guest.name || `VM ${vmid}`}
          </h1>
          <p className="text-muted-foreground">
            {guest.type.toUpperCase()} · {node} · VMID {vmid}
          </p>
        </div>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="size-4 text-primary" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPill status={status} />
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="size-4 text-primary" />
                {cpuPct != null ? "CPU" : "Cores"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cpuPct != null ? (
                <>
                  <p className="text-2xl font-semibold">{cpuPct}%</p>
                  <p className="text-xs text-muted-foreground">{cpus ?? "—"} cores</p>
                </>
              ) : (
                <p className="text-2xl font-semibold">{cpus ?? "—"}</p>
              )}
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
                {memUsedMb != null && memTotalMb != null
                  ? `${memUsedMb} / ${memTotalMb} MB`
                  : memTotalMb != null
                    ? `${memTotalMb} MB`
                    : "—"}
              </p>
              <p className="text-xs text-muted-foreground">used / total</p>
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Disk</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {diskUsed != null && diskTotal != null
                  ? `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`
                  : diskTotal != null
                    ? formatBytes(diskTotal)
                    : "—"}
              </p>
              <p className="text-xs text-muted-foreground">used / total</p>
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{guest.storage ?? "—"}</p>
            </CardContent>
          </Card>
        </section>

        {(uptime != null || netin != null || netout != null) && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold">Live</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uptime != null && (
                <Card className="main-glass-panel-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="size-4 text-primary" />
                      Uptime
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{formatUptime(uptime)}</p>
                  </CardContent>
                </Card>
              )}
              {(netin != null || netout != null) && (
                <Card className="main-glass-panel-card border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Network className="size-4 text-primary" />
                      Network
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      In {formatBytes(netin)} · Out {formatBytes(netout)}
                    </p>
                    <p className="text-xs text-muted-foreground">total transferred</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        <section>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Node and type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Node:</span>{" "}
                <Link
                  href={`/cluster/nodes/${encodeURIComponent(node)}`}
                  className="text-primary hover:underline"
                >
                  {node}
                </Link>
              </p>
              <p>
                <span className="text-muted-foreground">Type:</span> {guest.type}
              </p>
              {guest.hostname && (
                <p>
                  <span className="text-muted-foreground">Hostname:</span> {guest.hostname}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <AgentFooter />
    </>
  )
}
