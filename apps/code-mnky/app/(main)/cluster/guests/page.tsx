import Link from "next/link"
import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { isProxmoxConfigured, getClusterResources } from "@/lib/proxmox/client"
import { ArrowLeft } from "lucide-react"

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

type PageProps = { searchParams: Promise<{ node?: string; type?: string; status?: string }> }

export default async function GuestsPage({ searchParams }: PageProps) {
  const configured = isProxmoxConfigured()
  const params = await searchParams
  const filterNode = params.node?.trim()
  const filterType = params.type?.trim() as "qemu" | "lxc" | undefined
  const filterStatus = params.status?.trim()

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

  let allGuests: Awaited<ReturnType<typeof getClusterResources>> = []
  try {
    allGuests = await getClusterResources()
  } catch (e) {
    return (
      <>
        <AgentNav />
        <main className="main-container w-full flex-1 py-12">
          <Card className="main-glass-panel-card border-border/50 max-w-xl">
            <CardHeader>
              <CardTitle>Proxmox cluster</CardTitle>
              <CardDescription>
                Failed to load guests. {e instanceof Error ? e.message : "Unknown error"}
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <AgentFooter />
      </>
    )
  }

  const guests = allGuests.filter((g) => {
    if (filterNode && g.node !== filterNode) return false
    if (filterType && g.type !== filterType) return false
    if (filterStatus && g.status !== filterStatus) return false
    return true
  })

  const nodes = [...new Set(allGuests.map((g) => g.node))].sort()
  const types = ["qemu", "lxc"] as const
  const statuses = [...new Set(allGuests.map((g) => g.status))].sort()

  function buildFilterUrl(updates: { node?: string; type?: string; status?: string }) {
    const u = new URLSearchParams()
    if (updates.node ?? filterNode) u.set("node", (updates.node ?? filterNode) ?? "")
    if (updates.type ?? filterType) u.set("type", (updates.type ?? filterType) ?? "")
    if (updates.status ?? filterStatus) u.set("status", (updates.status ?? filterStatus) ?? "")
    const q = u.toString()
    return q ? `/cluster/guests?${q}` : "/cluster/guests"
  }

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

        <div className="mb-6 flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Cluster guests
          </h1>
          <p className="text-muted-foreground">
            {guests.length === allGuests.length
              ? `All VMs and LXC containers (${guests.length} total).`
              : `${guests.length} of ${allGuests.length} guests.`}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filter:</span>
            <Link
              href="/cluster/guests"
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                !filterNode && !filterType && !filterStatus
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 hover:border-primary/50"
              }`}
            >
              All
            </Link>
            {nodes.map((node) => (
              <Link
                key={node}
                href={buildFilterUrl({ node })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterNode === node ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-primary/50"
                }`}
              >
                {node}
              </Link>
            ))}
            <span className="ml-2 text-muted-foreground">Type:</span>
            {types.map((t) => (
              <Link
                key={t}
                href={buildFilterUrl({ type: t })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterType === t ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-primary/50"
                }`}
              >
                {t}
              </Link>
            ))}
            <span className="ml-2 text-muted-foreground">Status:</span>
            {statuses.map((s) => (
              <Link
                key={s}
                href={buildFilterUrl({ status: s })}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-primary/50"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        <Card className="main-glass-panel-card border-border/50">
          <CardHeader>
            <CardTitle>Guests</CardTitle>
            <CardDescription>VMID, name, node, type, status, resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">VMID</th>
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Node</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Cores</th>
                    <th className="pb-2 pr-4 font-medium">Memory (MB)</th>
                    <th className="pb-2 font-medium">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => {
                    const cpuPct = g.cpu != null ? (g.cpu * 100).toFixed(0) : null
                    const memUsedMb = g.mem != null ? Math.round(g.mem / 1024 / 1024) : null
                    const usageStr =
                      cpuPct != null && memUsedMb != null
                        ? `${cpuPct}% · ${memUsedMb >= 1024 ? `${(memUsedMb / 1024).toFixed(1)}G` : `${memUsedMb}M`}`
                        : cpuPct != null
                          ? `${cpuPct}%`
                          : memUsedMb != null
                            ? memUsedMb >= 1024
                              ? `${(memUsedMb / 1024).toFixed(1)}G`
                              : `${memUsedMb}M`
                            : "—"
                    return (
                      <tr key={`${g.node}-${g.vmid}`} className="border-b border-border/40">
                        <td className="py-2 pr-4">
                          <Link
                            href={`/cluster/guests/${encodeURIComponent(g.node)}/${g.vmid}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {g.vmid}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{g.name || "—"}</td>
                        <td className="py-2 pr-4">
                          <Link
                            href={`/cluster/nodes/${encodeURIComponent(g.node)}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {g.node}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{g.type}</td>
                        <td className="py-2 pr-4">
                          <StatusPill status={g.status} />
                        </td>
                        <td className="py-2 pr-4">{g.maxcpu ?? "—"}</td>
                        <td className="py-2 pr-4">
                          {g.maxmem != null
                            ? Math.round(g.maxmem / 1024 / 1024)
                            : "—"}
                        </td>
                        <td className="py-2 text-muted-foreground">{usageStr}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      <AgentFooter />
    </>
  )
}
