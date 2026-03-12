"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Users, Trophy } from "lucide-react";

type RegionOption = { id: number; name?: string; slug?: string };
type ServerOption = { id: number; name?: string; slug?: string };

export function FflogsGuildsClient({
  fflogsLinked,
  fflogsConfigured = true,
}: {
  fflogsLinked: boolean;
  fflogsConfigured?: boolean;
}) {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [regionId, setRegionId] = useState<string>("");
  const [regionSlug, setRegionSlug] = useState("");
  const [serverSlug, setServerSlug] = useState("");
  const [guildResult, setGuildResult] = useState<unknown>(null);
  const [guildsListResult, setGuildsListResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [zones, setZones] = useState<{ id: number; name?: string }[]>([]);
  const [attendanceZoneId, setAttendanceZoneId] = useState<string>("");
  const [guildAttendance, setGuildAttendance] = useState<unknown>(null);
  const [guildAttendanceLoading, setGuildAttendanceLoading] = useState(false);
  const [guildAttendanceError, setGuildAttendanceError] = useState<string | null>(null);
  const [guildAttendancePage, setGuildAttendancePage] = useState(1);
  const [guildZoneRanking, setGuildZoneRanking] = useState<unknown>(null);
  const [guildZoneRankingLoading, setGuildZoneRankingLoading] = useState(false);
  const [guildZoneRankingError, setGuildZoneRankingError] = useState<string | null>(null);
  const [zoneRankingZoneId, setZoneRankingZoneId] = useState<string>("");
  const [currentUserRank, setCurrentUserRank] = useState<unknown>(null);

  const loadRegions = useCallback(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/world/regions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RegionOption[]) => setRegions(Array.isArray(data) ? data : []))
      .catch(() => setRegions([]));
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  useEffect(() => {
    if (!regionId || !fflogsLinked) {
      setServers([]);
      setServerSlug("");
      return;
    }
    const id = parseInt(regionId, 10);
    if (Number.isNaN(id)) return;
    fetch(`/api/fflogs/world/servers?regionId=${id}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: ServerOption[] }) => setServers(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setServers([]));
    setServerSlug("");
  }, [regionId, fflogsLinked]);

  const handleRegionChange = (value: string) => {
    setRegionId(value);
    const r = regions.find((x) => String(x.id) === value);
    setRegionSlug(r?.slug ?? "");
  };

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/world/zones")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: number; name?: string }[]) => setZones(Array.isArray(data) ? data : []))
      .catch(() => setZones([]));
  }, [fflogsLinked, fflogsConfigured]);

  const currentGuildId = (() => {
    if (guildResult == null || typeof guildResult !== "object") return null;
    const id = (guildResult as { id?: number }).id;
    return typeof id === "number" && !Number.isNaN(id) ? id : null;
  })();

  useEffect(() => {
    if (currentGuildId == null) {
      setGuildAttendance(null);
      setGuildAttendanceError(null);
      return;
    }
    setGuildAttendanceLoading(true);
    setGuildAttendanceError(null);
    let url = `/api/fflogs/guild/${currentGuildId}/attendance?limit=16&page=${guildAttendancePage}`;
    if (attendanceZoneId) url += `&zoneID=${attendanceZoneId}`;
    fetch(url)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setGuildAttendanceError((data as { error: string }).error);
          setGuildAttendance(null);
        } else {
          setGuildAttendance(data);
          setGuildAttendanceError(null);
        }
      })
      .catch(() => {
        setGuildAttendanceError("Failed to load attendance");
        setGuildAttendance(null);
      })
      .finally(() => setGuildAttendanceLoading(false));
  }, [currentGuildId, guildAttendancePage, attendanceZoneId]);

  useEffect(() => {
    if (currentGuildId == null) {
      setGuildZoneRanking(null);
      setGuildZoneRankingError(null);
      return;
    }
    setGuildZoneRankingLoading(true);
    setGuildZoneRankingError(null);
    let url = `/api/fflogs/guild/${currentGuildId}/zone-ranking`;
    if (zoneRankingZoneId) url += `?zoneId=${zoneRankingZoneId}`;
    fetch(url)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setGuildZoneRankingError((data as { error: string }).error);
          setGuildZoneRanking(null);
        } else {
          setGuildZoneRanking(data);
          setGuildZoneRankingError(null);
        }
      })
      .catch(() => {
        setGuildZoneRankingError("Failed to load zone ranking");
        setGuildZoneRanking(null);
      })
      .finally(() => setGuildZoneRankingLoading(false));
  }, [currentGuildId, zoneRankingZoneId]);

  useEffect(() => {
    if (currentGuildId == null || !fflogsLinked) {
      setCurrentUserRank(null);
      return;
    }
    fetch(`/api/fflogs/guild/${currentGuildId}/current-user-rank`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setCurrentUserRank(null);
        } else {
          setCurrentUserRank(data);
        }
      })
      .catch(() => setCurrentUserRank(null));
  }, [currentGuildId, fflogsLinked]);

  async function handleGuildLookup() {
    if (!fflogsLinked) return;
    setError(null);
    setGuildResult(null);
    setGuildAttendancePage(1);
    setLoading(true);
    try {
      if (guildId.trim()) {
        const res = await fetch(`/api/fflogs/guild?id=${encodeURIComponent(guildId.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        setGuildResult(data);
      } else if (guildName.trim() && serverSlug && regionSlug) {
        const url = `/api/fflogs/guild?name=${encodeURIComponent(guildName.trim())}&serverSlug=${encodeURIComponent(serverSlug)}&serverRegion=${encodeURIComponent(regionSlug)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        setGuildResult(data);
      } else {
        setError("Enter guild ID, or name + region + server (choose from dropdowns).");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuildsList() {
    if (!fflogsLinked) return;
    setError(null);
    setGuildsListResult(null);
    setLoading(true);
    try {
      let url = "/api/fflogs/guilds?limit=50";
      if (serverSlug && regionSlug) {
        url += `&serverSlug=${encodeURIComponent(serverSlug)}&serverRegion=${encodeURIComponent(regionSlug)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setGuildsListResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load guilds");
    } finally {
      setLoading(false);
    }
  }

  if (!fflogsConfigured || !fflogsLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guilds</CardTitle>
          <CardDescription>
            Link your FFLogs account from the Overview to use guild lookup.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Guild lookup</CardTitle>
          </div>
          <CardDescription>
            Look up by guild ID or by name + server. Choose region and server from the dropdowns so the lookup works correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guild-id">Guild ID</Label>
              <Input
                id="guild-id"
                placeholder="FFLogs guild ID"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                aria-label="Guild ID"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">— or name + server + region —</p>
          <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="guild-name">Guild name</Label>
              <Input
                id="guild-name"
                placeholder="Guild name"
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
                aria-label="Guild name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guild-region-select">Region</Label>
              <Select value={regionId} onValueChange={handleRegionChange}>
                <SelectTrigger id="guild-region-select" aria-label="Select region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name ?? r.slug ?? String(r.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guild-server-select">Server</Label>
              <Select value={serverSlug} onValueChange={setServerSlug} disabled={!regionId}>
                <SelectTrigger id="guild-server-select" aria-label="Select server">
                  <SelectValue placeholder={regionId ? "Select server" : "Select region first"} />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((s) => (
                    <SelectItem key={s.id} value={s.slug ?? String(s.id)}>
                      {s.name ?? s.slug ?? String(s.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleGuildLookup} disabled={loading}>
            {loading ? "Loading…" : "Look up guild"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {guildResult != null && (
            <div className="space-y-2">
              {currentUserRank != null &&
                typeof currentUserRank === "object" &&
                "currentUserRank" in currentUserRank &&
                (currentUserRank as { currentUserRank?: unknown }).currentUserRank != null && (
                  <p className="text-sm font-medium">
                    Your rank: {String((currentUserRank as { currentUserRank: unknown }).currentUserRank)}
                  </p>
                )}
              <pre className="max-h-48 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
                {JSON.stringify(guildResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {currentGuildId != null && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Guild attendance</CardTitle>
              </div>
              <CardDescription>
                Attendance records for this guild. Optionally filter by zone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="attendance-zone-select" className="sr-only">Filter by zone</Label>
                <Select value={attendanceZoneId} onValueChange={setAttendanceZoneId}>
                  <SelectTrigger id="attendance-zone-select" className="w-[220px]" aria-label="Filter attendance by zone">
                    <SelectValue placeholder="All zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All zones</SelectItem>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={String(z.id)}>
                        {z.name ?? `Zone ${z.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {guildAttendanceLoading && !guildAttendance && (
                <p className="text-sm text-muted-foreground">Loading attendance…</p>
              )}
              {guildAttendanceError && (
                <p className="text-sm text-destructive">{guildAttendanceError}</p>
              )}
              {guildAttendance != null && !guildAttendanceLoading && (
                <>
                  <pre className="max-h-64 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
                    {JSON.stringify(guildAttendance, null, 2)}
                  </pre>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={guildAttendancePage <= 1}
                      onClick={() => setGuildAttendancePage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGuildAttendancePage((p) => p + 1)}
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Guild zone ranking</CardTitle>
              </div>
              <CardDescription>
                Zone ranking for this guild. Optionally select a zone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="zone-ranking-select" className="sr-only">Zone for ranking</Label>
                <Select value={zoneRankingZoneId} onValueChange={setZoneRankingZoneId}>
                  <SelectTrigger id="zone-ranking-select" className="w-[220px]" aria-label="Select zone for guild ranking">
                    <SelectValue placeholder="All zones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All zones</SelectItem>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={String(z.id)}>
                        {z.name ?? `Zone ${z.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {guildZoneRankingLoading && (
                <p className="text-sm text-muted-foreground">Loading zone ranking…</p>
              )}
              {guildZoneRankingError && (
                <p className="text-sm text-destructive">{guildZoneRankingError}</p>
              )}
              {guildZoneRanking != null && !guildZoneRankingLoading && (
                <pre className="max-h-64 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
                  {JSON.stringify(guildZoneRanking, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guilds list</CardTitle>
          <CardDescription>
            List guilds (paginated). Optionally filter by region and server using the dropdowns above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGuildsList} disabled={loading}>
            {loading ? "Loading…" : "Load guilds"}
          </Button>
          {guildsListResult != null && (
            <pre className="max-h-64 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
              {JSON.stringify(guildsListResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
