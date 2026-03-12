import Link from "next/link"
import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  isProxmoxConfigured,
  getClusterStatus,
  getNodes,
  getClusterResources,
  getClusterStorage,
  getClusterTasks,
  formatUptime,
  formatBytes,
} from "@/lib/proxmox/client"
import { Server, Cpu, HardDrive } from "lucide-react"

const CLUSTER_NAME = "MOODMNKY"

function StatusPill({
  status,
  label,
}: {
  status: string
  label?: string
}) {
  const ok = status === "online" || status === "running" || status === "ok"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
        ok
          ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }`}
    >
      {label ? `${label}: ` : ""}{status}
    </span>
  )
}

export default async function ClusterPage() {
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
                Cluster dashboard is not configured. Set PROXMOX_BASE_URL and PROXMOX_API_TOKEN in the server environment.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <AgentFooter />
      </>
    )
  }

  let clusterStatus: Awaited<ReturnType<typeof getClusterStatus>> | null = null
  let nodes: Awaited<ReturnType<typeof getNodes>> = []
  let guests: Awaited<ReturnType<typeof getClusterResources>> = []
  let storageList: Awaited<ReturnType<typeof getClusterStorage>> = []
  let tasksList: Awaited<ReturnType<typeof getClusterTasks>> = []

  try {
    ;[clusterStatus, nodes, guests] = await Promise.all([
      getClusterStatus(),
      getNodes(),
      getClusterResources(),
    ])
    const [storageResult, tasksResult] = await Promise.allSettled([
      getClusterStorage(),
      getClusterTasks(20),
    ])
    if (storageResult.status === "fulfilled") storageList = storageResult.value
    if (tasksResult.status === "fulfilled") tasksList = tasksResult.value
  } catch (e) {
    return (
      <>
        <AgentNav />
        <main className="main-container w-full flex-1 py-12">
          <Card className="main-glass-panel-card border-border/50 max-w-xl">
            <CardHeader>
              <CardTitle>Proxmox cluster</CardTitle>
              <CardDescription>
                Failed to reach Proxmox API. Check base URL, token, and network (e.g. TLS to primary node).
              </CardDescription>
              <p className="mt-2 text-sm text-destructive">
                {e instanceof Error ? e.message : "Unknown error"}
              </p>
            </CardHeader>
          </Card>
        </main>
        <AgentFooter />
      </>
    )
  }

  const nodeList = clusterStatus?.node_list ?? []
  const guestCount = guests.length
  const quorumOk = (clusterStatus?.quorum?.quorum ?? 0) > 0
  const guestCountQemu = guests.filter((g) => g.type === "qemu").length
  const guestCountLxc = guests.filter((g) => g.type === "lxc").length
  const clusterMemUsed = nodes.reduce((a, n) => a + (n.mem ?? 0), 0)
  const clusterMemTotal = nodes.reduce((a, n) => a + (n.maxmem ?? 0), 0)
  const clusterMemUsedGb =
    clusterMemTotal > 0 ? Math.round(clusterMemUsed / 1024 / 1024 / 1024) : null
  const clusterMemTotalGb =
    clusterMemTotal > 0 ? Math.round(clusterMemTotal / 1024 / 1024 / 1024) : null

  return (
    <>
      <AgentNav />
      <main className="main-container w-full flex-1 py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {CLUSTER_NAME} cluster
          </h1>
          <p className="text-muted-foreground">
            Cluster RAM, nodes (with guest count and uptime), guests by type, storage, and recent activity. Served from CODE-MNKY app.
          </p>
        </div>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="size-4 text-primary" />
                Cluster
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{CLUSTER_NAME}</p>
              <StatusPill status={quorumOk ? "ok" : "no quorum"} label="Quorum" />
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nodes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{nodeList.length}</p>
              <p className="text-xs text-muted-foreground">in cluster</p>
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="size-4 text-primary" />
                Cluster RAM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {clusterMemUsedGb != null && clusterMemTotalGb != null
                  ? `${clusterMemUsedGb} / ${clusterMemTotalGb} GB`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">used / total</p>
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                <Link href="/cluster/guests" className="text-primary hover:underline">
                  {guestCount}
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                {guestCountQemu} VMs, {guestCountLxc} LXC
              </p>
            </CardContent>
          </Card>
          <Card className="main-glass-panel-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Primary API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">CODE-MNKY</p>
              <p className="text-xs text-muted-foreground">nodeid 3</p>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Nodes</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nodeList.map((n, index) => {
              const nodeInfo = nodes.find((x) => x.node === n.node)
              const nodeGuestCount = guests.filter((g) => g.node === n.node).length
              const uniqueKey = n.id ?? n.node ?? `node-${index}`
              return (
                <Link key={uniqueKey} href={`/cluster/nodes/${encodeURIComponent(n.node)}`}>
                  <Card className="main-glass-panel-card main-float border-border/50 transition-colors hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Cpu className="size-4 text-primary" />
                          {n.node}
                        </span>
                        <StatusPill status={n.status} label="" />
                      </CardTitle>
                      <CardDescription>
                        {nodeInfo != null ? (
                          <>
                            CPU {nodeInfo.cpu != null ? `${(nodeInfo.cpu * 100).toFixed(0)}%` : "—"}
                            {nodeInfo.maxmem != null && (
                              <> · Mem {Math.round(nodeInfo.maxmem / 1024 / 1024 / 1024)} GB</>
                            )}
                            {nodeGuestCount > 0 && <> · {nodeGuestCount} guests</>}
                            {nodeInfo.uptime != null && (
                              <> · Uptime {formatUptime(nodeInfo.uptime)}</>
                            )}
                          </>
                        ) : (
                          <>Node {n.node}{nodeGuestCount > 0 ? ` · ${nodeGuestCount} guests` : ""}</>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        View node →
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Storage</h2>
          <Card className="main-glass-panel-card border-border/50">
            <CardContent className="pt-6">
              {storageList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Storage</th>
                        <th className="pb-2 pr-4 font-medium">Node</th>
                        <th className="pb-2 pr-4 font-medium">Used</th>
                        <th className="pb-2 pr-4 font-medium">Total</th>
                        <th className="pb-2 font-medium">Avail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageList.map((s) => (
                        <tr key={`${s.node ?? ""}-${s.storage}`} className="border-b border-border/40">
                          <td className="py-2 pr-4 font-medium">{s.storage}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{s.node ?? "—"}</td>
                          <td className="py-2 pr-4">{formatBytes(s.used ?? s.disk)}</td>
                          <td className="py-2 pr-4">{formatBytes(s.total ?? s.maxdisk)}</td>
                          <td className="py-2">{formatBytes(s.avail)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No storage data available. Storage is loaded from the cluster; if the request failed or returned no storage entries, this will be empty.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
          <Card className="main-glass-panel-card border-border/50">
            <CardContent className="pt-6">
              {tasksList.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {tasksList.slice(0, 15).map((t) => {
                    const startDate =
                      t.starttime != null
                        ? new Date(t.starttime * 1000).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"
                    return (
                      <li
                        key={t.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                      >
                        <span className="font-medium">{t.type ?? "task"}</span>
                        <span className="text-muted-foreground">{t.status ?? "—"}</span>
                        {t.node && (
                          <span className="text-muted-foreground">{t.node}</span>
                        )}
                        <span className="text-muted-foreground">{startDate}</span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent tasks. Tasks require cluster audit permissions; if the API returned none or failed, this will be empty.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cluster/guests">View all guests</Link>
          </Button>
        </section>
      </main>
      <AgentFooter />
    </>
  )
}
