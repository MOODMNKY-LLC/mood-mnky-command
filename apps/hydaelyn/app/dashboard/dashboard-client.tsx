"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createStreamSession } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, RefreshCw } from "lucide-react";

type ReportListItem = {
  code: string;
  title: string;
  startTime: number;
  endTime: number;
  owner?: { id: number; name: string };
};

type Session = {
  id: string;
  name: string;
  overlay_token: string;
  created_at: string;
  source: string;
};

export function DashboardClient({
  sessions,
  baseUrl,
  fflogsEnabled,
  fflogsConfigured = true,
  fflogsLinked,
}: {
  sessions: Session[];
  baseUrl: string;
  fflogsEnabled: boolean;
  fflogsConfigured?: boolean;
  fflogsLinked: boolean;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    setReportsLoading(true);
    setReportsError(null);
    fetch("/api/fflogs/reports")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Link FFLogs from the dashboard." : res.statusText);
        return res.json();
      })
      .then((data: { data: ReportListItem[] }) => setReports(data.data ?? []))
      .catch((e) => setReportsError(e instanceof Error ? e.message : "Failed to load reports"))
      .finally(() => setReportsLoading(false));
  }, [fflogsLinked, fflogsConfigured]);

  async function refreshReports() {
    if (!fflogsLinked) return;
    setReportsLoading(true);
    setReportsError(null);
    try {
      const res = await fetch("/api/fflogs/reports");
      if (!res.ok) throw new Error(res.status === 403 ? "Link FFLogs first." : res.statusText);
      const data = await res.json();
      setReports(data.data ?? []);
    } catch (e) {
      setReportsError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setReportsLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await createStreamSession(name);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
  }

  function copyUrl(url: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="space-y-8">
      {fflogsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FFLogs</CardTitle>
            <CardDescription>
              {!fflogsConfigured
                ? "Set FFLOGS_CLIENT_ID and NEXT_PUBLIC_FFLOGS_ENABLED in .env.local, then restart the dev server."
                : fflogsLinked
                  ? "Your FFLogs account is linked. You can use private reports and user data in Hydaelyn."
                  : "Link your FFLogs account to use private reports and sign in with FFLogs."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!fflogsConfigured ? (
              <p className="text-sm text-muted-foreground">
                FFLogs integration is hidden in production until configured.
              </p>
            ) : fflogsLinked ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">FFLogs linked. View your reports below.</p>
              </div>
            ) : (
              <Button asChild variant="outline">
                <Link href="/auth/fflogs/authorize?intent=link">
                  Link FFLogs account
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {fflogsLinked && fflogsConfigured && (
        <Card id="reports">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">My FFLogs reports</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshReports}
                disabled={reportsLoading}
              >
                <RefreshCw className={`h-4 w-4 ${reportsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <CardDescription>
              Reports from your linked FFLogs account. Open a report to view fights and details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportsError && (
              <p className="text-sm text-destructive">{reportsError}</p>
            )}
            {reportsLoading && reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading reports…</p>
            ) : reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports found. Upload logs to FFLogs to see them here.</p>
            ) : (
              <ul className="space-y-2">
                {reports.map((r) => (
                  <li key={r.code}>
                    <Link
                      href={`/reports/${r.code}`}
                      className="block rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                    >
                      <span className="font-medium">{r.title || r.code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {new Date(r.startTime).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create stream session</CardTitle>
          <CardDescription>
            Create a new session to get an overlay token and URLs for OBS and ACT.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session name</Label>
              <Input
                id="session-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tuesday prog"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create session"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div id="sessions" className="space-y-4">
        <h2 className="text-lg font-semibold">Your sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground">No sessions yet. Create one above.</p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => {
              const obsUrl = baseUrl ? `${baseUrl}/overlay/stream?token=${s.overlay_token}` : "";
              const actIngestUrl = baseUrl ? `${baseUrl}/overlays/act-ingest/index.html?token=${s.overlay_token}` : "";
              const actOverlayFullUrl = baseUrl ? `${baseUrl}/overlay/act?token=${s.overlay_token}` : "";
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{s.name}</CardTitle>
                      <Badge variant="secondary">{s.source}</Badge>
                    </div>
                    <CardDescription>
                      Created {new Date(s.created_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">OBS overlay URL</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={obsUrl}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(obsUrl)}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Use this URL in OBS Browser Source. Add to scene, set size, optionally enable click-through.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">ACT ingest overlay URL</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={actIngestUrl}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(actIngestUrl)}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add this URL in OverlayPlugin as a new overlay. The token is in the URL; combat data will be sent to Hydaelyn.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">ACT overlay (full — Parse + Ingest + Settings)</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={actOverlayFullUrl}
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(actOverlayFullUrl)}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        React overlay with DPS table, ingest status, and settings. Use in OverlayPlugin or OBS with ?OVERLAY_WS=ws://127.0.0.1:10501/ws.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        In ACT, OverlayPlugin will append &amp;HOST_PORT=ws://127.0.0.1/fake/ to the URL — that is normal and the overlay still works.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Overlay token</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={s.overlay_token}
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyUrl(s.overlay_token)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
