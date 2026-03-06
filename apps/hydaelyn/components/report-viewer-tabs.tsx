"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FFLogsFight } from "@/lib/fflogs/client";

export function ReportViewerTabs({
  reportCode,
  fights,
  reportStartTime,
  reportEndTime,
}: {
  reportCode: string;
  fights: FFLogsFight[];
  reportStartTime?: number;
  reportEndTime?: number;
}) {
  const [selectedFightId, setSelectedFightId] = useState<string>("");
  const fightIds = selectedFightId ? [parseInt(selectedFightId, 10)] : [];

  useEffect(() => {
    if (fights.length > 0 && !selectedFightId) {
      setSelectedFightId(String(fights[0].id));
    }
  }, [fights, selectedFightId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Report data</CardTitle>
        <CardDescription>
          Per-fight table, graph, rankings, roster, events, and master data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <label htmlFor="report-fight-select" className="text-sm text-muted-foreground">Fight:</label>
          <Select value={selectedFightId || (fights[0] ? String(fights[0].id) : "")} onValueChange={setSelectedFightId}>
            <SelectTrigger id="report-fight-select" className="w-[280px]" aria-label="Select fight for table, graph, and rankings">
              <SelectValue placeholder="Select fight" />
            </SelectTrigger>
            <SelectContent>
              {fights.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.name} ({f.kill ? "Kill" : "Wipe"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Tabs defaultValue="table" className="w-full" aria-label="Report data tabs">
          <TabsList className="flex flex-wrap h-auto gap-1" aria-label="Report data views">
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="roster">Roster</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="master">Master data</TabsTrigger>
          </TabsList>
          <TabsContent value="table" className="mt-4">
            <ReportTableTab reportCode={reportCode} fightIds={fightIds} reportStartTime={reportStartTime} reportEndTime={reportEndTime} />
          </TabsContent>
          <TabsContent value="graph" className="mt-4">
            <ReportGraphTab reportCode={reportCode} fightIds={fightIds} reportStartTime={reportStartTime} reportEndTime={reportEndTime} />
          </TabsContent>
          <TabsContent value="rankings" className="mt-4">
            <ReportRankingsTab reportCode={reportCode} fightIds={fightIds} />
          </TabsContent>
          <TabsContent value="roster" className="mt-4">
            <ReportRosterTab reportCode={reportCode} fightIds={fightIds} />
          </TabsContent>
          <TabsContent value="events" className="mt-4">
            <ReportEventsTab reportCode={reportCode} fightIds={fightIds} reportStartTime={reportStartTime} reportEndTime={reportEndTime} />
          </TabsContent>
          <TabsContent value="master" className="mt-4">
            <ReportMasterTab reportCode={reportCode} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** Extract rows array from table-like API response (multiple possible shapes). */
function extractTableEntries(data: unknown): Record<string, unknown>[] | null {
  if (data == null) return null;
  const o = data as Record<string, unknown>;
  const from = (x: unknown): Record<string, unknown>[] | null =>
    Array.isArray(x) ? x.filter((r) => typeof r === "object" && r !== null) as Record<string, unknown>[] : null;
  const d = o.data as Record<string, unknown> | undefined;
  return (
    from(o.data) ??
    from(d?.entries) ??
    from(d?.composition) ??
    from(o.entries) ??
    from(o.composition) ??
    from(o)
  );
}

/** Extract table payload (object with totalTime, composition, etc.) for summary display. */
function getTablePayload(data: unknown): Record<string, unknown> | null {
  if (data == null) return null;
  const o = data as Record<string, unknown>;
  const d = o.data as Record<string, unknown> | undefined;
  return (d && typeof d === "object") ? d : (typeof o.data === "object" && o.data !== null ? (o.data as Record<string, unknown>) : null);
}

/** Flatten a row so nested objects become displayable (e.g. { name: { name: "X" } } -> { name: "X" }). */
function flattenRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v == null) {
      out[k] = v;
    } else if (Array.isArray(v)) {
      if (v.length > 0 && typeof v[0] === "object" && v[0] !== null) {
        const first = v[0] as Record<string, unknown>;
        if ("spec" in first && first.spec != null) out[k] = (v as Record<string, unknown>[]).map((x) => (x as Record<string, unknown>).spec ?? (x as Record<string, unknown>).role).join(", ");
        else if ("name" in first && first.name != null) out[k] = (v as Record<string, unknown>[]).map((x) => (x as Record<string, unknown>).name).join(", ");
        else out[k] = v.length === 1 ? first : v;
      } else out[k] = v;
    } else if (typeof v === "object" && !(v instanceof Date)) {
      const sub = v as Record<string, unknown>;
      if ("name" in sub && typeof sub.name === "string") out[k] = sub.name;
      else if ("id" in sub) out[k] = sub.id;
      else out[k] = JSON.stringify(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Format cell value for display (numbers with commas, etc.). */
function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (typeof v === "object") return typeof (v as Record<string, unknown>).name === "string" ? (v as Record<string, unknown>).name as string : JSON.stringify(v);
  return String(v);
}

function ReportTableTab({ reportCode, fightIds, reportStartTime, reportEndTime }: { reportCode: string; fightIds: number[]; reportStartTime?: number; reportEndTime?: number }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasFightIds = fightIds.length > 0;
    const hasTimeRange = reportStartTime != null && reportEndTime != null;
    if (!hasFightIds && !hasTimeRange) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (fightIds.length) params.set("fightIDs", fightIds.join(","));
    else if (reportStartTime != null && reportEndTime != null) {
      params.set("startTime", String(reportStartTime));
      params.set("endTime", String(reportEndTime));
    }
    params.set("dataType", "Summary");
    params.set("viewBy", "Source");
    fetch(`/api/fflogs/reports/${reportCode}/table?${params}`)
      .then((res) => res.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [reportCode, fightIds.join(","), reportStartTime, reportEndTime]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading table…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (data == null) return null;
  const payload = getTablePayload(data);
  const entries = extractTableEntries(data);
  const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  const summaryKeys = ["totalTime", "combatTime", "itemLevel", "logVersion"];
  const hasSummary = payload && summaryKeys.some((k) => payload[k] != null);
  if (entries && entries.length > 0) {
    const flat = entries.map((r) => flattenRow(r));
    const keys = Object.keys(flat[0]);
    const priority = ["name", "type", "total", "dps", "damage", "healing", "hps", "duration", "percent", "ilvl", "job", "role", "spec", "specs"];
    const ordered = [...new Set([...priority.filter((k) => keys.includes(k)), ...keys])];
    return (
      <div className="space-y-4">
        {hasSummary && (
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Summary</div>
            <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {summaryKeys.filter((k) => payload![k] != null).map((k) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{label(k)}</span>
                  <span className="font-medium">{formatCell(payload![k])}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">Party / rows · {entries.length}</div>
          <Table>
            <TableHeader>
              <TableRow>
                {ordered.map((k) => (
                  <TableHead key={k} className="font-medium">{label(k)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {flat.slice(0, 100).map((row, i) => (
                <TableRow key={i}>
                  {ordered.map((k) => (
                    <TableCell key={k} className="text-muted-foreground">{formatCell(row[k])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {entries.length > 100 && <p className="border-t px-4 py-2 text-xs text-muted-foreground">Showing first 100 of {entries.length}</p>}
        </div>
      </div>
    );
  }
  if (hasSummary) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Summary</div>
          <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {summaryKeys.filter((k) => payload![k] != null).map((k) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{label(k)}</span>
                <span className="font-medium">{formatCell(payload![k])}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">No table rows in this response.</p>
      </div>
    );
  }
  return <JsonFallback data={data} />;
}

function ReportGraphTab({ reportCode, fightIds, reportStartTime, reportEndTime }: { reportCode: string; fightIds: number[]; reportStartTime?: number; reportEndTime?: number }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasFightIds = fightIds.length > 0;
    const hasTimeRange = reportStartTime != null && reportEndTime != null;
    if (!hasFightIds && !hasTimeRange) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (fightIds.length) params.set("fightIDs", fightIds.join(","));
    else if (reportStartTime != null && reportEndTime != null) {
      params.set("startTime", String(reportStartTime));
      params.set("endTime", String(reportEndTime));
    }
    params.set("dataType", "DamageDone");
    params.set("viewBy", "Source");
    fetch(`/api/fflogs/reports/${reportCode}/graph?${params}`)
      .then((res) => res.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [reportCode, fightIds.join(","), reportStartTime, reportEndTime]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading graph…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (data == null) return null;
  const payload = data as { data?: unknown };
  const raw = payload.data ?? payload;
  const rawSeries = (raw as Record<string, unknown>)?.series ?? (Array.isArray(raw) ? raw : null);
  const seriesArray = Array.isArray(rawSeries) ? rawSeries : [];
  if (seriesArray.length > 0) {
    try {
      const series = seriesArray as Array<{ name?: string; data?: Array<{ timestamp?: number; value?: number } | [number, number]> }>;
      const timeMap = new Map<number, Record<string, number>>();
      for (const s of series.slice(0, 12)) {
        const key = (s.name ?? "unknown").replace(/\W/g, "_");
        const points = s.data ?? [];
        for (const d of points.slice(0, 1000)) {
          const t = Array.isArray(d) ? d[0] : (d.timestamp ?? 0);
          const v = Array.isArray(d) ? d[1] : (d.value ?? 0);
          if (!timeMap.has(t)) timeMap.set(t, { time: t });
          (timeMap.get(t) as Record<string, number>)[key] = v;
        }
      }
      const chartData = Array.from(timeMap.values()).sort((a, b) => (a.time as number) - (b.time as number));
      if (chartData.length > 0) {
        const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = require("recharts");
        const keys = series.slice(0, 12).map((s) => (s.name ?? "unknown").replace(/\W/g, "_"));
        const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))", "hsl(var(--muted-foreground))", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f1f5f9"];
        return (
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 text-sm font-medium text-foreground">Damage over time</div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} tickFormatter={(v: number) => (v / 1000).toFixed(0)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [v?.toLocaleString() ?? 0, ""]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {keys.map((k, i) => (
                    <Line key={k} type="monotone" dataKey={k} name={series[i]?.name ?? k} connectNulls stroke={colors[i % colors.length]} dot={false} strokeWidth={1.5} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    } catch {
      // fallback
    }
  }
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      No graph series in this range. Select a fight with damage data or try another data type.
    </div>
  );
}

function ReportRankingsTab({ reportCode, fightIds }: { reportCode: string; fightIds: number[] }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fightIds.length === 0) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("fightIDs", fightIds.join(","));
    fetch(`/api/fflogs/reports/${reportCode}/rankings?${params}`)
      .then((res) => res.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [reportCode, fightIds.join(",")]);

  if (fightIds.length === 0) return <p className="text-sm text-muted-foreground">Select a fight to view rankings.</p>;
  if (loading) return <p className="text-sm text-muted-foreground">Loading rankings…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (data == null) return null;
  const rows = Array.isArray(data) ? data : (data as Record<string, unknown>)?.rankings ?? (data as Record<string, unknown>)?.data;
  const list = Array.isArray(rows) ? rows : [];
  if (list.length > 0 && typeof list[0] === "object" && list[0] !== null) {
    const keys = Object.keys(list[0] as Record<string, unknown>);
    const label = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {keys.map((k) => (
                <TableHead key={k} className="font-medium">{label(k)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.slice(0, 100).map((row, i) => (
              <TableRow key={i}>
                {keys.map((k) => (
                  <TableCell key={k}>{(row as Record<string, unknown>)[k] != null ? String((row as Record<string, unknown>)[k]) : "—"}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {list.length > 100 && <p className="border-t px-4 py-2 text-xs text-muted-foreground">Showing first 100 of {list.length}</p>}
      </div>
    );
  }
  return <JsonFallback data={data} />;
}

/** Extract player/roster list from playerDetails-like API response. */
function extractRosterPlayers(data: unknown): Record<string, unknown>[] | null {
  if (data == null) return null;
  const o = data as Record<string, unknown>;
  const raw = o.data ?? o;
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.playerDetails)) return r.playerDetails as Record<string, unknown>[];
  const pd = r.playerDetails as Record<string, unknown> | undefined;
  if (pd && typeof pd === "object") {
    const concat = [
      ...(Array.isArray(pd.tanks) ? pd.tanks : []),
      ...(Array.isArray(pd.healers) ? pd.healers : []),
      ...(Array.isArray(pd.dps) ? pd.dps : []),
    ];
    if (concat.length > 0) return concat as Record<string, unknown>[];
  }
  const concat = [
    ...(Array.isArray(r.tanks) ? r.tanks : []),
    ...(Array.isArray(r.healers) ? r.healers : []),
    ...(Array.isArray(r.dps) ? r.dps : []),
  ];
  if (concat.length > 0) return concat as Record<string, unknown>[];
  const inner = r.data as Record<string, unknown> | undefined;
  if (inner?.playerDetails && typeof inner.playerDetails === "object") {
    const innerPd = inner.playerDetails as Record<string, unknown>;
    const innerConcat = [
      ...(Array.isArray(innerPd.tanks) ? innerPd.tanks : []),
      ...(Array.isArray(innerPd.healers) ? innerPd.healers : []),
      ...(Array.isArray(innerPd.dps) ? innerPd.dps : []),
    ];
    if (innerConcat.length > 0) return innerConcat as Record<string, unknown>[];
  }
  return null;
}

const ROSTER_DISPLAY_KEYS = ["spec", "role", "job", "class", "ilvl", "itemLevel", "server", "region", "type", "subType", "icon"];

function ReportRosterTab({ reportCode, fightIds }: { reportCode: string; fightIds: number[] }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fightIds.length === 0) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("fightIDs", fightIds.join(","));
    fetch(`/api/fflogs/reports/${reportCode}/player-details?${params}`)
      .then((res) => res.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [reportCode, fightIds.join(",")]);

  if (fightIds.length === 0) return <p className="text-sm text-muted-foreground">Select a fight to view roster.</p>;
  if (loading) return <p className="text-sm text-muted-foreground">Loading roster…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (data == null) return null;
  const players = extractRosterPlayers(data);
  if (players && players.length > 0) {
    const getDisplayName = (p: Record<string, unknown>) => {
      const n = p.name ?? p.playerName ?? p.displayName;
      if (typeof n === "string") return n;
      if (n && typeof n === "object" && "name" in n) return String((n as Record<string, unknown>).name);
      return null;
    };
    return (
      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground">Roster · {players.length} player{players.length !== 1 ? "s" : ""}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.slice(0, 24).map((p, i) => {
            const name = getDisplayName(p) ?? `Player ${i + 1}`;
            const flat = flattenRow(p);
            const keys = ROSTER_DISPLAY_KEYS.filter((k) => k in flat && flat[k] != null);
            const rest = Object.keys(flat).filter((k) => !/^name|playerName|displayName$/i.test(k) && !keys.includes(k)).slice(0, 4);
            const allKeys = [...keys, ...rest];
            return (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-sm font-medium leading-tight">{name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 py-0 text-xs text-muted-foreground">
                  {allKeys.slice(0, 10).map((k) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="truncate text-right font-medium text-foreground">{formatCell(flat[k])}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {players.length > 24 && <p className="text-xs text-muted-foreground">Showing 24 of {players.length}</p>}
      </div>
    );
  }
  return <JsonFallback data={data} />;
}

function ReportEventsTab({ reportCode, fightIds, reportStartTime, reportEndTime }: { reportCode: string; fightIds: number[]; reportStartTime?: number; reportEndTime?: number }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fightIds.length === 0) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("fightIDs", fightIds.join(","));
    params.set("limit", "500");
    fetch(`/api/fflogs/reports/${reportCode}/events?${params}`)
      .then((res) => res.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [reportCode, fightIds.join(",")]);

  if (fightIds.length === 0) return <p className="text-sm text-muted-foreground">Select a fight to view events.</p>;
  if (loading) return <p className="text-sm text-muted-foreground">Loading events…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (data == null) return null;
  const payload = data as { data?: unknown[] };
  const events = (Array.isArray(payload.data) ? payload.data : []) as Array<Record<string, unknown>>;
  if (events.length > 0) {
    const sample = events[0];
    const keys = Object.keys(sample).filter((k) => ["type", "timestamp", "sourceID", "targetID", "ability", "fight"].includes(k) || k.toLowerCase().includes("type") || k.toLowerCase().includes("time"));
    const displayKeys = keys.length > 0 ? keys : Object.keys(sample).slice(0, 6);
    return (
      <div className="rounded-lg border bg-card">
        <p className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">{events.length} events</p>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                {displayKeys.map((k) => (
                  <TableHead key={k} className="font-medium">{k}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 200).map((ev, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  {displayKeys.map((k) => (
                    <TableCell key={k} className="text-xs">{(ev as Record<string, unknown>)[k] != null ? String((ev as Record<string, unknown>)[k]) : "—"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {events.length > 200 && <p className="border-t px-4 py-2 text-xs text-muted-foreground">Showing first 200 of {events.length}</p>}
      </div>
    );
  }
  return <JsonFallback data={data} />;
}

function ReportMasterTab({ reportCode }: { reportCode: string }) {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/fflogs/reports/${reportCode}/master-data`)
      .then((res) => res.json())
      .then((json) => (json.error ? setError(json.error) : setData(json)))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [reportCode]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading master data…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (data == null) return null;
  const master = data as { actors?: unknown; abilities?: unknown };
  const actors = Array.isArray(master.actors) ? master.actors : (master.actors as Record<string, unknown>)?.data;
  const abilities = Array.isArray(master.abilities) ? master.abilities : (master.abilities as Record<string, unknown>)?.data;
  const actorList = Array.isArray(actors) ? actors : [];
  const abilityList = Array.isArray(abilities) ? abilities : [];
  const renderTable = (title: string, list: unknown[], max: number) => {
    if (list.length === 0) return null;
    const first = list[0];
    if (typeof first !== "object" || first === null) return null;
    const keys = Object.keys(first as Record<string, unknown>);
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {keys.map((k) => (
                  <TableHead key={k} className="font-medium">{k}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.slice(0, max).map((row, i) => (
                <TableRow key={i}>
                  {keys.map((k) => (
                    <TableCell key={k} className="text-xs">{(row as Record<string, unknown>)[k] != null ? String((row as Record<string, unknown>)[k]) : "—"}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {list.length > max && <p className="text-xs text-muted-foreground">Showing {max} of {list.length}</p>}
      </div>
    );
  };
  if (actorList.length > 0 || abilityList.length > 0) {
    return (
      <div className="space-y-6">
        {renderTable("Actors", actorList, 50)}
        {renderTable("Abilities", abilityList, 50)}
      </div>
    );
  }
  return <JsonFallback data={data} />;
}

function JsonFallback({ data }: { data: unknown }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Raw data</p>
      <pre className="max-h-96 overflow-auto rounded border bg-background/80 p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
