"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Swords, Users, Database, Sparkles, RefreshCw } from "lucide-react";
import { JobIcon } from "@/components/job-icon";

type Encounter = {
  encid: string;
  title: string | null;
  starttime: string | null;
  endtime: string | null;
  duration: number | null;
  damage: number | null;
  encdps: number | null;
  zone: string | null;
  kills: number | null;
  deaths: number | null;
};

type Combatant = {
  id: number;
  encid: string;
  name: string | null;
  job: string | null;
  dps: number | null;
  encdps: number | null;
  damage: number | null;
};

type CurrentRow = {
  id: number;
  encid: string | null;
  title: string | null;
  starttime: string | null;
  duration: number | null;
  encdps: number | null;
};

export function ActContextClient({
  encounters,
  combatants,
  current,
  error: initialError,
}: {
  encounters: Encounter[];
  combatants: Combatant[];
  current: CurrentRow[];
  error?: string | null;
}) {
  const router = useRouter();
  const [insightEncid, setInsightEncid] = useState<string>("");
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  async function generateInsight() {
    const encid = insightEncid || encounters[0]?.encid;
    if (!encid) return;
    setInsightLoading(true);
    setInsightError(null);
    setInsightText(null);
    try {
      const res = await fetch("/api/act/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setInsightText(data.text);
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {initialError && (
          <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">
            {initialError}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
          className="ml-auto shrink-0"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {encounters.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">AI insights</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateInsight}
                disabled={insightLoading}
              >
                {insightLoading ? "Generating…" : "Generate insight"}
              </Button>
            </div>
            <CardDescription>
              Brief strategic summary for an encounter. Requires OPENAI_API_KEY.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insightError && (
              <p className="text-sm text-destructive">{insightError}</p>
            )}
            {insightText && (
              <p className="text-sm whitespace-pre-wrap">{insightText}</p>
            )}
            {encounters.length > 0 && !insightText && !insightError && !insightLoading && (
              <div className="flex flex-wrap items-center gap-2">
                <Select value={insightEncid || encounters[0]?.encid} onValueChange={setInsightEncid}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pick encounter" />
                  </SelectTrigger>
                  <SelectContent>
                    {encounters.slice(0, 20).map((e) => (
                      <SelectItem key={e.encid} value={e.encid}>
                        {e.title || e.encid} ({e.zone ?? "—"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">then click Generate insight.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card id="encounters">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Encounters</CardTitle>
          </div>
          <CardDescription>
            Data from ACT ODBC export or overlay ingest. Export from ACT to Supabase, or use the ACT ingest overlay to send live data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {encounters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No encounter data yet. Use ACT ODBC export to Supabase or the ACT ingest overlay (with a stream session token) to send live data.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">ID</th>
                    <th className="text-left py-2 pr-4">Title</th>
                    <th className="text-left py-2 pr-4">Zone</th>
                    <th className="text-right py-2 pr-4">Duration</th>
                    <th className="text-right py-2 pr-4">Damage</th>
                    <th className="text-right py-2 pr-4">DPS</th>
                  </tr>
                </thead>
                <tbody>
                  {encounters.map((e) => (
                    <tr key={e.encid} className="border-b">
                      <td className="py-2 pr-4 font-mono">{e.encid}</td>
                      <td className="py-2 pr-4">{e.title ?? "—"}</td>
                      <td className="py-2 pr-4">{e.zone ?? "—"}</td>
                      <td className="text-right py-2 pr-4">{e.duration ?? "—"}</td>
                      <td className="text-right py-2 pr-4">{e.damage != null ? e.damage.toLocaleString() : "—"}</td>
                      <td className="text-right py-2 pr-4">{e.encdps != null ? Math.round(e.encdps).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="combatants">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Combatants</CardTitle>
          </div>
          <CardDescription>
            Per-encounter combatant stats (ACT ODBC or overlay ingest).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {combatants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No combatant data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Encounter</th>
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Job</th>
                    <th className="text-right py-2 pr-4">DPS</th>
                    <th className="text-right py-2 pr-4">Damage</th>
                  </tr>
                </thead>
                <tbody>
                  {combatants.slice(0, 50).map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="py-2 pr-4 font-mono">{c.encid}</td>
                      <td className="py-2 pr-4">{c.name ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <JobIcon job={c.job} size={20} showName />
                      </td>
                      <td className="text-right py-2 pr-4">{c.dps != null ? Math.round(c.dps).toLocaleString() : "—"}</td>
                      <td className="text-right py-2 pr-4">{c.damage != null ? c.damage.toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {combatants.length > 50 && (
                <p className="mt-2 text-xs text-muted-foreground">Showing first 50 of {combatants.length}.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="current">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Current encounter</CardTitle>
          </div>
          <CardDescription>
            Snapshot of current encounter (current_table).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {current.length === 0 ? (
            <p className="text-sm text-muted-foreground">No current encounter data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Title</th>
                    <th className="text-left py-2 pr-4">Enc ID</th>
                    <th className="text-right py-2 pr-4">Duration</th>
                    <th className="text-right py-2 pr-4">DPS</th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 pr-4">{r.title ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono">{r.encid ?? "—"}</td>
                      <td className="text-right py-2 pr-4">{r.duration ?? "—"}</td>
                      <td className="text-right py-2 pr-4">{r.encdps != null ? Math.round(r.encdps).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
