"use client";

import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useProxmoxApi } from "./use-proxmox-api";
import type { PveRrdData } from "@/lib/proxmox-api";
import { formatBytes } from "@/lib/proxmox-api";
import { Skeleton } from "@/components/ui/skeleton";

type ChartPoint = { time: number; label: string; [key: string]: number | string };

function buildChartData(rrd: PveRrdData["data"]): ChartPoint[] {
  if (!rrd?.t?.length) return [];
  const len = rrd.t.length;
  const rows: ChartPoint[] = [];
  for (let i = 0; i < len; i++) {
    const row: ChartPoint = {
      time: rrd.t[i] ?? 0,
      label: new Date((rrd.t[i] ?? 0) * 1000).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    if (rrd.cpu?.length) row.cpu = rrd.cpu[i] ?? 0;
    if (rrd.load?.length) row.load = rrd.load[i] ?? 0;
    if (rrd.mem?.length) row.mem = rrd.mem[i] ?? 0;
    if (rrd.maxmem?.length) row.maxmem = rrd.maxmem[i] ?? 0;
    if (rrd.netin?.length) row.netin = rrd.netin[i] ?? 0;
    if (rrd.netout?.length) row.netout = rrd.netout[i] ?? 0;
    rows.push(row);
  }
  return rows;
}

const cpuConfig: ChartConfig = {
  cpu: { label: "CPU usage", color: "hsl(var(--chart-1))" },
};
const loadConfig: ChartConfig = {
  load: { label: "Load", color: "hsl(var(--chart-1))" },
};
const memConfig: ChartConfig = {
  mem: { label: "Used", color: "hsl(var(--chart-1))" },
  maxmem: { label: "Total", color: "hsl(var(--chart-2))" },
};
const netConfig: ChartConfig = {
  netin: { label: "In", color: "hsl(var(--chart-1))" },
  netout: { label: "Out", color: "hsl(var(--chart-2))" },
};

/** Demo data when RRD fails or is empty */
function demoData(): ChartPoint[] {
  const now = Math.floor(Date.now() / 1000);
  const points: ChartPoint[] = [];
  for (let i = 60; i >= 0; i--) {
    const t = now - i * 60;
    points.push({
      time: t,
      label: new Date(t * 1000).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cpu: 5 + Math.sin(i / 10) * 15,
      load: 0.2 + Math.sin(i / 8) * 0.2,
      mem: 8e9 + Math.sin(i / 12) * 2e9,
      maxmem: 32e9,
      netin: 1000 + Math.sin(i / 5) * 500,
      netout: 500 + Math.sin(i / 7) * 300,
    });
  }
  return points;
}

type Props = { node: string };

export function ProxmoxRrdCharts({ node }: Props) {
  const api = useProxmoxApi();
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFallback(false);
    api
      .get<PveRrdData>(`nodes/${encodeURIComponent(node)}/rrddata`, {
        timeframe: "hour",
        cf: "AVERAGE",
        ds: ["cpu", "load", "mem", "maxmem", "netin", "netout"],
      })
      .then((r) => {
        const raw = (r as PveRrdData).data;
        const built = buildChartData(raw);
        if (built.length > 0) {
          setData(built);
        } else {
          setData(demoData());
          setFallback(true);
        }
      })
      .catch(() => {
        setData(demoData());
        setFallback(true);
      })
      .finally(() => setLoading(false));
  }, [api, node]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="main-glass-panel-card border-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">CPU usage</CardTitle>
          {fallback && (
            <p className="text-xs text-muted-foreground">
              Connect Prometheus/Grafana for live metrics
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ChartContainer config={cpuConfig} className="h-[180px] w-full">
            <AreaChart data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="var(--color-cpu)"
                fill="var(--color-cpu)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="main-glass-panel-card border-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">Server load</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={loadConfig} className="h-[180px] w-full">
            <AreaChart data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="load"
                stroke="var(--color-load)"
                fill="var(--color-load)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="main-glass-panel-card border-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">Memory usage</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={memConfig} className="h-[180px] w-full">
            <AreaChart data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                width={40}
                tickFormatter={(v) => `${Number(v) / 1e9}G`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(v) => (typeof v === "number" ? formatBytes(v) : v)}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="mem"
                stroke="var(--color-mem)"
                fill="var(--color-mem)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="maxmem"
                stroke="var(--color-maxmem)"
                fill="transparent"
                strokeDasharray="2 2"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="main-glass-panel-card border-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm font-medium">Network traffic</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={netConfig} className="h-[180px] w-full">
            <AreaChart data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={36} tickFormatter={(v) => `${Number(v) / 1024}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="netin"
                stroke="var(--color-netin)"
                fill="var(--color-netin)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="netout"
                stroke="var(--color-netout)"
                fill="var(--color-netout)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
