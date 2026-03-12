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
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Search, RefreshCw, BarChart3, Trophy } from "lucide-react";
import { LodestoneCharacterCard } from "@/components/lodestone-character-card";
import Link from "next/link";

type RegionOption = { id: number; name?: string; slug?: string };
type ServerOption = { id: number; name?: string; slug?: string };

type ProfileCharacter = {
  id: number;
  name?: string;
  server?: { id?: number; slug?: string; region?: { id?: number; name?: string; slug?: string } };
};

type ProfileGuild = {
  id: number;
  name?: string;
  description?: string;
  type?: number;
  server?: { id?: number; slug?: string; region?: { id?: number; name?: string; slug?: string } };
  tags?: Array<{ id: number; name?: string }>;
};

type UserProfile = {
  id: number;
  name?: string;
  avatar?: string;
  characters: ProfileCharacter[];
  guilds: ProfileGuild[];
};

export function FflogsCharactersClient({
  fflogsLinked,
  fflogsConfigured = true,
}: {
  fflogsLinked: boolean;
  fflogsConfigured?: boolean;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState<string>("");
  const [regionSlug, setRegionSlug] = useState("");
  const [serverSlug, setServerSlug] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [lodestoneId, setLodestoneId] = useState("");
  const [guildID, setGuildID] = useState("");
  const [characterResult, setCharacterResult] = useState<unknown>(null);
  const [guildRosterResult, setGuildRosterResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [servers, setServers] = useState<ServerOption[]>([]);

  const [zones, setZones] = useState<{ id: number; name?: string }[]>([]);
  const [characterReports, setCharacterReports] = useState<{ data: { code: string; title?: string; startTime?: number }[]; hasMorePages?: boolean } | null>(null);
  const [characterReportsLoading, setCharacterReportsLoading] = useState(false);
  const [characterReportsError, setCharacterReportsError] = useState<string | null>(null);
  const [characterReportsPage, setCharacterReportsPage] = useState(1);
  const [zoneRankings, setZoneRankings] = useState<unknown>(null);
  const [zoneRankingsLoading, setZoneRankingsLoading] = useState(false);
  const [zoneRankingsError, setZoneRankingsError] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [characterGameData, setCharacterGameData] = useState<unknown>(null);
  const [characterGameDataLoading, setCharacterGameDataLoading] = useState(false);
  const [characterGameDataError, setCharacterGameDataError] = useState<string | null>(null);
  const [encounterRankingsEncounterId, setEncounterRankingsEncounterId] = useState("");
  const [encounterRankings, setEncounterRankings] = useState<unknown>(null);
  const [encounterRankingsLoading, setEncounterRankingsLoading] = useState(false);
  const [encounterRankingsError, setEncounterRankingsError] = useState<string | null>(null);

  const loadProfile = useCallback(() => {
    if (!fflogsLinked) return;
    setProfileLoading(true);
    setProfileError(null);
    fetch("/api/fflogs/me/profile")
      .then((res) => res.json())
      .then((data: UserProfile | { error?: string }) => {
        if ("error" in data && data.error) {
          setProfileError(data.error);
          setProfile(null);
        } else {
          setProfile(data as UserProfile);
          setProfileError(null);
        }
      })
      .catch(() => {
        setProfileError("Failed to load profile");
        setProfile(null);
      })
      .finally(() => setProfileLoading(false));
  }, [fflogsLinked]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/world/zones")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: number; name?: string }[]) => setZones(Array.isArray(data) ? data : []))
      .catch(() => setZones([]));
  }, [fflogsLinked, fflogsConfigured]);

  const currentCharacterId = (() => {
    if (characterResult == null || typeof characterResult !== "object") return null;
    const id = (characterResult as { id?: number }).id;
    return typeof id === "number" && !Number.isNaN(id) ? id : null;
  })();

  useEffect(() => {
    if (currentCharacterId == null) {
      setCharacterReports(null);
      setCharacterReportsError(null);
      return;
    }
    setCharacterReportsLoading(true);
    setCharacterReportsError(null);
    fetch(`/api/fflogs/character/reports?characterId=${currentCharacterId}&limit=10&page=${characterReportsPage}`)
      .then((res) => res.json())
      .then((data: { data?: unknown[]; hasMorePages?: boolean; error?: string }) => {
        if (data.error) {
          setCharacterReportsError(data.error);
          setCharacterReports(null);
        } else {
          setCharacterReports({
            data: Array.isArray(data.data) ? data.data as { code: string; title?: string; startTime?: number }[] : [],
            hasMorePages: data.hasMorePages,
          });
          setCharacterReportsError(null);
        }
      })
      .catch(() => {
        setCharacterReportsError("Failed to load reports");
        setCharacterReports(null);
      })
      .finally(() => setCharacterReportsLoading(false));
  }, [currentCharacterId, characterReportsPage]);

  useEffect(() => {
    if (currentCharacterId == null || !selectedZoneId) {
      setZoneRankings(null);
      setZoneRankingsError(null);
      return;
    }
    const zoneId = parseInt(selectedZoneId, 10);
    if (Number.isNaN(zoneId)) return;
    setZoneRankingsLoading(true);
    setZoneRankingsError(null);
    fetch(`/api/fflogs/character/rankings?characterId=${currentCharacterId}&zoneID=${zoneId}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setZoneRankingsError((data as { error: string }).error);
          setZoneRankings(null);
        } else {
          setZoneRankings(data);
          setZoneRankingsError(null);
        }
      })
      .catch(() => {
        setZoneRankingsError("Failed to load rankings");
        setZoneRankings(null);
      })
      .finally(() => setZoneRankingsLoading(false));
  }, [currentCharacterId, selectedZoneId]);

  useEffect(() => {
    if (currentCharacterId == null || !fflogsLinked) {
      setCharacterGameData(null);
      setCharacterGameDataError(null);
      return;
    }
    const charName = name.trim();
    const charServer = serverSlug.trim();
    setCharacterGameDataLoading(true);
    setCharacterGameDataError(null);

    async function load() {
      try {
        if (charName && charServer) {
          const lodestoneRes = await fetch(
            `/api/lodestone/character?name=${encodeURIComponent(charName)}&server=${encodeURIComponent(charServer)}`,
          );
          if (lodestoneRes.ok) {
            const lodestoneData = await lodestoneRes.json();
            if (lodestoneData?.source === "lodestone") {
              setCharacterGameData(lodestoneData);
              setCharacterGameDataError(null);
              return;
            }
          }
        }
        const res = await fetch(`/api/fflogs/character/game-data?characterId=${currentCharacterId}`);
        const data = await res.json();
        if (data != null && typeof data === "object" && "error" in data) {
          setCharacterGameDataError((data as { error: string }).error);
          setCharacterGameData(null);
        } else if (data != null && typeof data === "object" && "cacheExpired" in data && (data as { cacheExpired?: boolean }).cacheExpired) {
          const msg = (data as { message?: string }).message;
          setCharacterGameDataError(msg ?? "Cached data expired. Using FFLogs cache; click Refresh to try again.");
          setCharacterGameData(null);
        } else if (typeof data === "string" && /cached data.*expired|update the character/i.test(data)) {
          setCharacterGameDataError("Cached data expired. Using FFLogs cache; click Refresh to try again.");
          setCharacterGameData(null);
        } else {
          setCharacterGameData(data);
          setCharacterGameDataError(null);
        }
      } catch {
        setCharacterGameDataError("Failed to load gear data");
        setCharacterGameData(null);
      } finally {
        setCharacterGameDataLoading(false);
      }
    }
    load();
  }, [currentCharacterId, name, serverSlug, fflogsLinked]);

  async function refreshCharacterGameData() {
    if (currentCharacterId == null || !fflogsLinked) return;
    const charName = name.trim();
    const charServer = serverSlug.trim();
    setCharacterGameDataLoading(true);
    setCharacterGameDataError(null);
    try {
      if (charName && charServer) {
        const lodestoneRes = await fetch(
          `/api/lodestone/character?name=${encodeURIComponent(charName)}&server=${encodeURIComponent(charServer)}`,
        );
        if (lodestoneRes.ok) {
          const lodestoneData = await lodestoneRes.json();
          if (lodestoneData?.source === "lodestone") {
            setCharacterGameData(lodestoneData);
            setCharacterGameDataError(null);
            return;
          }
        }
      }
      const res = await fetch(`/api/fflogs/character/game-data?characterId=${currentCharacterId}&forceUpdate=true`);
      const data = await res.json();
      if (!res.ok || (data != null && typeof data === "object" && "error" in data)) {
        setCharacterGameDataError((data as { error?: string }).error ?? "Failed to refresh");
        setCharacterGameData(null);
      } else if (data != null && typeof data === "object" && "cacheExpired" in data && (data as { cacheExpired?: boolean }).cacheExpired) {
        setCharacterGameDataError((data as { message?: string }).message ?? "Cache still expired. Update on FFLogs first, or use Lodestone (XIVAPI) if name+server match.");
        setCharacterGameData(null);
      } else {
        setCharacterGameData(data);
        setCharacterGameDataError(null);
      }
    } catch {
      setCharacterGameDataError("Failed to refresh");
      setCharacterGameData(null);
    } finally {
      setCharacterGameDataLoading(false);
    }
  }

  async function loadEncounterRankings() {
    if (currentCharacterId == null || !encounterRankingsEncounterId.trim() || !fflogsLinked) return;
    const encounterId = parseInt(encounterRankingsEncounterId.trim(), 10);
    if (Number.isNaN(encounterId)) {
      setEncounterRankingsError("Enter a valid encounter ID");
      return;
    }
    setEncounterRankingsLoading(true);
    setEncounterRankingsError(null);
    try {
      const res = await fetch(
        `/api/fflogs/character/encounter-rankings?characterId=${currentCharacterId}&encounterID=${encounterId}`,
      );
      const data = await res.json();
      if (!res.ok || (data != null && typeof data === "object" && "error" in data)) {
        setEncounterRankingsError((data as { error?: string }).error ?? "Failed to load");
        setEncounterRankings(null);
      } else {
        setEncounterRankings(data);
        setEncounterRankingsError(null);
      }
    } catch {
      setEncounterRankingsError("Failed to load parse history");
      setEncounterRankings(null);
    } finally {
      setEncounterRankingsLoading(false);
    }
  }

  const handleRegionChange = (value: string) => {
    setRegionId(value);
    const r = regions.find((x) => String(x.id) === value);
    setRegionSlug(r?.slug ?? "");
  };

  const handleServerChange = (value: string) => {
    setServerSlug(value);
  };

  async function handleUseMyCharacter() {
    if (!fflogsLinked) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/fflogs/me/default-character");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const dc = data.defaultCharacter;
      if (dc?.name && dc?.serverSlug && dc?.serverRegion) {
        setName(dc.name);
        setServerSlug(dc.serverSlug);
        const region = regions.find((r) => r.slug === dc.serverRegion);
        if (region) {
          setRegionId(String(region.id));
          setRegionSlug(region.slug ?? "");
        } else {
          setRegionSlug(dc.serverRegion);
        }
      } else {
        setError("No report with character data found. Upload a report to FFLogs first.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load default character");
    } finally {
      setLoading(false);
    }
  }

  async function handleCharacterLookup() {
    if (!fflogsLinked) return;
    setError(null);
    setCharacterResult(null);
    setCharacterReportsPage(1);
    setSelectedZoneId("");
    setLoading(true);
    try {
      if (characterId.trim()) {
        const res = await fetch(`/api/fflogs/character?id=${encodeURIComponent(characterId.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        setCharacterResult(data);
      } else if (lodestoneId.trim()) {
        const res = await fetch(`/api/fflogs/character?lodestoneID=${encodeURIComponent(lodestoneId.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        setCharacterResult(data);
      } else if (name.trim() && serverSlug && regionSlug) {
        const url = `/api/fflogs/character?name=${encodeURIComponent(name.trim())}&serverSlug=${encodeURIComponent(serverSlug)}&serverRegion=${encodeURIComponent(regionSlug)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? res.statusText);
        setCharacterResult(data);
      } else {
        setError("Enter character ID, Lodestone ID, or name + region + server (choose from dropdowns).");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuildRoster() {
    if (!fflogsLinked || !guildID.trim()) return;
    setError(null);
    setGuildRosterResult(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/fflogs/characters?guildID=${encodeURIComponent(guildID.trim())}&limit=100`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setGuildRosterResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }

  if (!fflogsConfigured || !fflogsLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Characters</CardTitle>
          <CardDescription>
            Link your FFLogs account from the Overview to see your claimed characters, guilds, and statics—and to use lookup tools.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* My characters (claimed on FFLogs) */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">My characters</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadProfile}
              disabled={profileLoading}
              aria-label="Refresh profile"
            >
              <RefreshCw className={`h-4 w-4 ${profileLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <CardDescription>
            Characters claimed to your FFLogs account. Claim characters on FFLogs to see them here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading && !profile && (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          )}
          {profileError && !profile && (
            <p className="text-sm text-destructive">
              {profileError}
              {profileError.includes("view-user-profile") || profileError.includes("403") ? (
                <span className="block mt-1 text-muted-foreground">
                  Re-link your FFLogs account from the dashboard to grant profile access.
                </span>
              ) : null}
            </p>
          )}
          {profile && !profileLoading && (
            <>
              {profile.characters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No characters claimed yet. Claim characters on FFLogs (link your Lodestone), then refresh.
                </p>
              ) : (
                <ul className="space-y-2" role="list">
                  {profile.characters.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setCharacterResult({ id: c.id, name: c.name, server: c.server })}
                        className="flex w-full flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label={`View reports and rankings for ${c.name ?? "character"}`}
                      >
                        <span className="font-medium">{c.name ?? "Unknown"}</span>
                        {c.server && (
                          <span className="text-muted-foreground">
                            {c.server.region?.name ?? c.server.region?.slug ?? ""} · {c.server.slug ?? ""}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          ID {c.id}
                        </Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* My guilds & statics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">My guilds & statics</CardTitle>
          </div>
          <CardDescription>
            Free Companies and statics (raid teams) you belong to on FFLogs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading && !profile && null}
          {profileError && !profile && null}
          {profile && !profileLoading && (
            <>
              {profile.guilds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No guilds or statics linked. Add your Free Company or static on FFLogs to see them here.
                </p>
              ) : (
                <ul className="space-y-3" role="list">
                  {profile.guilds.map((g) => (
                    <li
                      key={g.id}
                      className="rounded-md border bg-muted/30 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{g.name ?? "Unknown"}</span>
                        <Badge variant={g.type === 1 ? "default" : "outline"} className="text-xs">
                          {g.type === 1 ? "Static" : "Free Company"}
                        </Badge>
                        {g.server && (
                          <span className="text-muted-foreground text-sm">
                            {g.server.region?.name ?? g.server.region?.slug ?? ""} · {g.server.slug ?? ""}
                          </span>
                        )}
                      </div>
                      {g.tags && g.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {g.tags.map((t) => (
                            <Badge key={t.id} variant="secondary" className="text-xs font-normal">
                              {t.name ?? `Tag ${t.id}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Lookup tools */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Look up any character</CardTitle>
          </div>
          <CardDescription>
            By character ID, Lodestone ID, or name + server. Use region and server dropdowns for name lookup.
            To claim or hide parses on FFLogs, add <strong>fflogs-hidden</strong> or <strong>fflogs-visible</strong> to your Lodestone character profile, then click Update on your character page on FFLogs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleUseMyCharacter} disabled={loading}>
              Use my character
            </Button>
            <span className="text-xs text-muted-foreground">Pre-fill from your latest report</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="character-id">Character ID</Label>
              <Input
                id="character-id"
                placeholder="FFLogs character ID"
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                aria-label="Character ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lodestone-id">Lodestone ID</Label>
              <Input
                id="lodestone-id"
                placeholder="Lodestone ID"
                value={lodestoneId}
                onChange={(e) => setLodestoneId(e.target.value)}
                aria-label="Lodestone ID"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">— or name + server + region —</p>
          <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="char-name">Character name</Label>
              <Input
                id="char-name"
                placeholder="Character name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Character name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region-select">Region</Label>
              <Select value={regionId} onValueChange={handleRegionChange}>
                <SelectTrigger id="region-select" aria-label="Select region">
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
              <Label htmlFor="server-select">Server</Label>
              <Select value={serverSlug} onValueChange={handleServerChange} disabled={!regionId}>
                <SelectTrigger id="server-select" aria-label="Select server">
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
          <Button onClick={handleCharacterLookup} disabled={loading}>
            {loading ? "Loading…" : "Look up character"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {characterResult != null && (
            <pre className="max-h-48 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
              {JSON.stringify(characterResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {currentCharacterId != null && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Recent reports</CardTitle>
              </div>
              <CardDescription>
                Reports featuring this character. Click to open.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {characterReportsLoading && !characterReports && (
                <p className="text-sm text-muted-foreground">Loading reports…</p>
              )}
              {characterReportsError && (
                <p className="text-sm text-destructive">{characterReportsError}</p>
              )}
              {characterReports && !characterReportsLoading && (
                <>
                  {characterReports.data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reports found.</p>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {characterReports.data.map((r) => (
                        <li key={r.code}>
                          <Link
                            href={`/reports/${r.code}`}
                            className="block rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                            aria-label={`View report: ${r.title ?? r.code}`}
                          >
                            <span className="font-medium">{r.title ?? r.code}</span>
                            <span className="ml-2 text-muted-foreground">
                              {r.startTime != null ? new Date(r.startTime).toLocaleDateString() : ""}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">· View report</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  {characterReports.hasMorePages && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={characterReportsPage <= 1}
                        onClick={() => setCharacterReportsPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous page"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCharacterReportsPage((p) => p + 1)}
                        aria-label="Next page"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Zone rankings</CardTitle>
              </div>
              <CardDescription>
                Select a zone to view this character&apos;s rankings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="zone-rankings-select" className="sr-only">Zone for rankings</Label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                  <SelectTrigger id="zone-rankings-select" className="w-[220px]" aria-label="Select zone for rankings">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={String(z.id)}>
                        {z.name ?? `Zone ${z.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {zoneRankingsLoading && (
                <p className="text-sm text-muted-foreground">Loading rankings…</p>
              )}
              {zoneRankingsError && (
                <p className="text-sm text-destructive">{zoneRankingsError}</p>
              )}
              {zoneRankings != null && !zoneRankingsLoading && (
                <pre className="max-h-64 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
                  {JSON.stringify(zoneRankings, null, 2)}
                </pre>
              )}
              {selectedZoneId && !zoneRankingsLoading && !zoneRankingsError && zoneRankings == null && (
                <p className="text-sm text-muted-foreground">No ranking data for this zone.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Gear (Lodestone)</CardTitle>
                  <CardDescription>
                    Cached gear and job data from FFLogs. Click Refresh to fetch from Lodestone.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCharacterGameData}
                  disabled={characterGameDataLoading}
                  aria-label="Refresh from Lodestone"
                >
                  {characterGameDataLoading ? "Loading…" : "Refresh from Lodestone"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {characterGameDataError && (
                <p className="text-sm text-destructive">{characterGameDataError}</p>
              )}
              {characterGameData != null && !characterGameDataLoading && (
                (characterGameData as { source?: string })?.source === "lodestone" ? (
                  <LodestoneCharacterCard data={characterGameData as { source?: string; classJobs?: { name?: string; level?: number }[] }} />
                ) : (
                  <pre className="max-h-64 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
                    {typeof characterGameData === "object"
                      ? JSON.stringify(characterGameData, null, 2)
                      : String(characterGameData)}
                  </pre>
                )
              )}
              {characterGameData == null && !characterGameDataLoading && !characterGameDataError && (
                <p className="text-sm text-muted-foreground">No cached data. Click &quot;Refresh from Lodestone&quot; to fetch.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parse history (single boss)</CardTitle>
              <CardDescription>
                View this character&apos;s parse history for one encounter. Use an encounter ID (e.g. from zone detail).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Encounter ID"
                  value={encounterRankingsEncounterId}
                  onChange={(e) => setEncounterRankingsEncounterId(e.target.value)}
                  className="w-32"
                  aria-label="Encounter ID"
                />
                <Button onClick={loadEncounterRankings} disabled={encounterRankingsLoading}>
                  {encounterRankingsLoading ? "Loading…" : "Load parse history"}
                </Button>
              </div>
              {encounterRankingsError && (
                <p className="text-sm text-destructive">{encounterRankingsError}</p>
              )}
              {encounterRankings != null && !encounterRankingsLoading && (
                <pre className="max-h-64 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
                  {typeof encounterRankings === "object"
                    ? JSON.stringify(encounterRankings, null, 2)
                    : String(encounterRankings)}
                </pre>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guild roster</CardTitle>
          <CardDescription>
            List characters in a guild by guild ID (use an ID from My guilds above or from guild lookup).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Guild ID"
              value={guildID}
              onChange={(e) => setGuildID(e.target.value)}
              className="max-w-[200px]"
              aria-label="Guild ID"
            />
            <Button onClick={handleGuildRoster} disabled={loading}>
              {loading ? "Loading…" : "Load roster"}
            </Button>
          </div>
          {guildRosterResult != null && (
            <pre className="max-h-64 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
              {JSON.stringify(guildRosterResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
