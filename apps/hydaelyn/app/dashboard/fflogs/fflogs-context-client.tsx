"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, RefreshCw, Gauge, Trophy, Globe, Swords, Gamepad2, User, Download, Loader2 } from "lucide-react";
import Image from "next/image";
import { ApiHealthLights } from "@/components/api-health-lights";
import { LodestoneCharacterCard } from "@/components/lodestone-character-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import type { DutyCategory } from "@/lib/dashboard-context";
import { filterZonesByDuty } from "@/lib/fflogs/zone-categories";
import { createClient } from "@/lib/supabase/client";

type ReportListItem = {
  code: string;
  title: string;
  startTime: number;
  endTime: number;
  owner?: { id: number; name: string };
};

type ZoneOption = { id: number; name?: string };

type OverviewCharacter = {
  id: number;
  name: string;
  serverSlug: string;
  serverRegion: string;
};

type ProfileCharacter = {
  id: number;
  name?: string;
  server?: { slug?: string; region?: { slug?: string } };
};

type UserProfile = {
  characters: ProfileCharacter[];
};

type ImportJob = {
  id: string;
  report_code: string;
  status: string;
  fight_ids: number[];
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

function formatRelativeTime(ms: number): string {
  const d = new Date(ms);
  const now = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function RankingsTable({ data }: { data: unknown }) {
  const rows = Array.isArray(data) ? data : null;
  if (!rows || rows.length === 0) {
    return (
      <pre className="max-h-48 overflow-auto rounded border bg-muted/30 p-2 text-xs">
        {typeof data === "object" ? JSON.stringify(data, null, 2) : String(data)}
      </pre>
    );
  }
  const first = rows[0] as Record<string, unknown>;
  const keys = Object.keys(first).filter((k) => typeof first[k] !== "object" || first[k] === null);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {keys.map((k) => (
            <TableHead key={k} className="capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {keys.map((k) => (
              <TableCell key={k}>
                {row[k] != null ? String(row[k]) : "—"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function buildReportsUrl(params: { page?: number; limit?: number; startTime?: number; endTime?: number; zoneID?: number }) {
  const u = new URL("/api/fflogs/reports", window.location.origin);
  if (params.page != null) u.searchParams.set("page", String(params.page));
  if (params.limit != null) u.searchParams.set("limit", String(params.limit));
  if (params.startTime != null) u.searchParams.set("startTime", String(params.startTime));
  if (params.endTime != null) u.searchParams.set("endTime", String(params.endTime));
  if (params.zoneID != null) u.searchParams.set("zoneID", String(params.zoneID));
  return u.toString();
}

export function FflogsContextClient({
  fflogsEnabled,
  fflogsConfigured = true,
  fflogsLinked,
}: {
  fflogsEnabled: boolean;
  fflogsConfigured?: boolean;
  fflogsLinked: boolean;
}) {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [zoneID, setZoneID] = useState<number | "">("");
  const [startTime, setStartTime] = useState<number | "">("");
  const [endTime, setEndTime] = useState<number | "">("");
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [fflogsUser, setFflogsUser] = useState<{ id: number | string; name?: string } | null>(null);
  const [rateLimit, setRateLimit] = useState<{ limitPerHour?: number; pointsSpentThisHour?: number; pointsResetIn?: number } | null>(null);
  const [progressRace, setProgressRace] = useState<unknown>(null);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [composition, setComposition] = useState<unknown>(null);
  const [compositionLoading, setCompositionLoading] = useState(false);
  const [compositionError, setCompositionError] = useState<string | null>(null);

  const [selectedReportCodes, setSelectedReportCodes] = useState<Set<string>>(new Set());
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [importJobsLoading, setImportJobsLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [expansions, setExpansions] = useState<{ id: number; name?: string }[]>([]);
  const [expansionZones, setExpansionZones] = useState<{ id: number; name?: string }[]>([]);
  const [selectedExpansionId, setSelectedExpansionId] = useState<string>("");
  const [zoneDetail, setZoneDetail] = useState<unknown>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [zoneDetailLoading, setZoneDetailLoading] = useState(false);
  const [encounterDetail, setEncounterDetail] = useState<unknown>(null);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string>("");
  const [encounterDetailLoading, setEncounterDetailLoading] = useState(false);

  const [gameClasses, setGameClasses] = useState<{ id: number; name?: string; slug?: string }[]>([]);
  const [gameFactions, setGameFactions] = useState<{ id: number; name?: string }[]>([]);
  const [gameAbilities, setGameAbilities] = useState<{ data?: { id: number; name?: string }[] } | null>(null);
  const [classesZoneId, setClassesZoneId] = useState<string>("all");
  const [classesFactionId, setClassesFactionId] = useState<string>("all");
  const [classDetail, setClassDetail] = useState<unknown>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [classDetailLoading, setClassDetailLoading] = useState(false);
  const [abilityDetail, setAbilityDetail] = useState<unknown>(null);
  const [selectedAbilityId, setSelectedAbilityId] = useState<string>("");
  const [abilityDetailLoading, setAbilityDetailLoading] = useState(false);

  const [overviewCharacter, setOverviewCharacter] = useState<OverviewCharacter | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [overviewZoneId, setOverviewZoneId] = useState<string>("");
  const [overviewMetric, setOverviewMetric] = useState<string>("dps");
  const [characterRankings, setCharacterRankings] = useState<unknown>(null);
  const [characterRankingsLoading, setCharacterRankingsLoading] = useState(false);
  const [characterRankingsError, setCharacterRankingsError] = useState<string | null>(null);
  const [lastReportTime, setLastReportTime] = useState<number | null>(null);
  const [characterGameData, setCharacterGameData] = useState<unknown>(null);
  const [characterGameDataLoading, setCharacterGameDataLoading] = useState(false);
  const [characterGameDataError, setCharacterGameDataError] = useState<string | null>(null);
  const [encounterLeaderboardId, setEncounterLeaderboardId] = useState("");
  const [encounterLeaderboardResult, setEncounterLeaderboardResult] = useState<unknown>(null);
  const [encounterLeaderboardLoading, setEncounterLeaderboardLoading] = useState(false);

  const searchParams = useSearchParams();
  const dutyParam = searchParams.get("duty");
  const duty: DutyCategory | null =
    dutyParam && ["savage", "ultimates", "trials", "raids", "dungeons"].includes(dutyParam)
      ? (dutyParam as DutyCategory)
      : null;
  const filteredZones = duty ? filterZonesByDuty(zones, duty) : zones;

  const loadReports = useCallback(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    setReportsLoading(true);
    setReportsError(null);
    const url = buildReportsUrl({
      page,
      limit: 50,
      startTime: startTime === "" ? undefined : startTime,
      endTime: endTime === "" ? undefined : endTime,
      zoneID: zoneID === "" ? undefined : zoneID,
    });
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Link FFLogs from the dashboard." : res.statusText);
        return res.json();
      })
      .then((data: { data: ReportListItem[] }) => setReports(data.data ?? []))
      .catch((e) => setReportsError(e instanceof Error ? e.message : "Failed to load reports"))
      .finally(() => setReportsLoading(false));
  }, [fflogsLinked, fflogsConfigured, page, zoneID, startTime, endTime]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const fetchImportJobs = useCallback(() => {
    setImportJobsLoading(true);
    fetch("/api/fflogs/import/jobs")
      .then((res) => (res.ok ? res.json() : { jobs: [] }))
      .then((data: { jobs?: ImportJob[] }) => setImportJobs(data.jobs ?? []))
      .catch(() => setImportJobs([]))
      .finally(() => setImportJobsLoading(false));
  }, []);

  useEffect(() => {
    if (!fflogsLinked) return;
    fetchImportJobs();
    const supabase = createClient();
    const channel = supabase
      .channel("fflogs_import_jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fflogs_import_jobs" },
        () => { fetchImportJobs(); },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fflogsLinked, fetchImportJobs]);

  const toggleReportSelection = (code: string) => {
    setSelectedReportCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectAllReports = () => {
    setSelectedReportCodes(new Set(reports.map((r) => r.code)));
  };

  const clearReportSelection = () => {
    setSelectedReportCodes(new Set());
  };

  const runImportForAI = async () => {
    if (selectedReportCodes.size === 0) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const res = await fetch("/api/fflogs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportCodes: Array.from(selectedReportCodes) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed");
        return;
      }
      setSelectedReportCodes(new Set());
      for (;;) {
        const processRes = await fetch("/api/fflogs/import/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const processData = (await processRes.json()) as { processed?: boolean };
        if (processData.processed !== true) break;
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImportLoading(false);
    }
  };

  // Load profile and default character together so we can prefer report-based default, then fall back to first claimed character
  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    const profilePromise = fetch("/api/fflogs/me/profile").then((res) => (res.ok ? res.json() : null));
    const defaultPromise = fetch("/api/fflogs/me/default-character").then((res) => (res.ok ? res.json() : null));
    Promise.all([profilePromise, defaultPromise])
      .then(([profileData, defaultData]) => {
        const profile = profileData != null && !("error" in profileData) ? (profileData as UserProfile) : null;
        const dc = (defaultData as { defaultCharacter?: OverviewCharacter } | null)?.defaultCharacter;
        setProfile(profile);
        // Prefer character from latest report; if none, use first claimed character linked to the account
        if (dc?.id != null && dc?.name && dc?.serverSlug && dc?.serverRegion) {
          setOverviewCharacter({
            id: dc.id,
            name: dc.name,
            serverSlug: dc.serverSlug,
            serverRegion: dc.serverRegion,
          });
        } else if (profile?.characters?.length) {
          const first = profile.characters[0];
          const serverSlug = first?.server?.slug ?? "";
          const serverRegion = first?.server?.region?.slug ?? "";
          if (first?.id != null && first?.name && serverSlug && serverRegion) {
            setOverviewCharacter({
              id: first.id,
              name: first.name,
              serverSlug,
              serverRegion,
            });
          }
        }
      })
      .catch(() => {});
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    if (reports.length > 0 && reports[0].startTime != null) {
      setLastReportTime(reports[0].startTime);
    }
  }, [reports]);

  useEffect(() => {
    if (!overviewCharacter?.id || !overviewZoneId || !fflogsLinked) {
      setCharacterRankings(null);
      setCharacterRankingsError(null);
      return;
    }
    setCharacterRankingsLoading(true);
    setCharacterRankingsError(null);
    const params = new URLSearchParams({
      characterId: String(overviewCharacter.id),
      zoneID: overviewZoneId,
    });
    if (overviewMetric) params.set("metric", overviewMetric);
    fetch(`/api/fflogs/character/rankings?${params.toString()}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setCharacterRankingsError((data as { error: string }).error);
          setCharacterRankings(null);
        } else {
          setCharacterRankings(data);
          setCharacterRankingsError(null);
        }
      })
      .catch(() => {
        setCharacterRankingsError("Failed to load rankings");
        setCharacterRankings(null);
      })
      .finally(() => setCharacterRankingsLoading(false));
  }, [overviewCharacter?.id, overviewZoneId, overviewMetric, fflogsLinked]);

  useEffect(() => {
    if (!overviewCharacter?.id || !fflogsLinked) {
      setCharacterGameData(null);
      setCharacterGameDataError(null);
      return;
    }
    const charName = overviewCharacter.name?.trim();
    const charServer = overviewCharacter.serverSlug?.trim();
    setCharacterGameDataLoading(true);
    setCharacterGameDataError(null);

    async function load() {
      const charId = overviewCharacter?.id;
      if (!charId) return;
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
        const res = await fetch(
          `/api/fflogs/character/game-data?characterId=${encodeURIComponent(charId)}`,
        );
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
  }, [overviewCharacter?.id, overviewCharacter?.name, overviewCharacter?.serverSlug, fflogsLinked]);

  async function refreshCharacterGameData() {
    if (!overviewCharacter?.id || !fflogsLinked) return;
    const charName = overviewCharacter.name?.trim();
    const charServer = overviewCharacter.serverSlug?.trim();
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
      const res = await fetch(`/api/fflogs/character/game-data?characterId=${encodeURIComponent(overviewCharacter.id)}&forceUpdate=true`);
      const data = await res.json();
      if (!res.ok || (data != null && typeof data === "object" && "error" in data)) {
        setCharacterGameDataError((data as { error?: string }).error ?? "Failed to refresh");
        setCharacterGameData(null);
      } else if (data != null && typeof data === "object" && "cacheExpired" in data && (data as { cacheExpired?: boolean }).cacheExpired) {
        setCharacterGameDataError((data as { message?: string }).message ?? "Cache still expired. Update the character on FFLogs first, or use Lodestone (XIVAPI) if name+server match.");
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

  async function loadEncounterLeaderboard(type: "character" | "fight") {
    const id = encounterLeaderboardId.trim();
    const encounterId = id ? parseInt(id, 10) : NaN;
    if (Number.isNaN(encounterId) || !fflogsLinked) return;
    setEncounterLeaderboardLoading(true);
    setEncounterLeaderboardResult(null);
    try {
      const path = type === "character"
        ? `/api/fflogs/world/encounter/${encounterId}/character-rankings`
        : `/api/fflogs/world/encounter/${encounterId}/fight-rankings`;
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) setEncounterLeaderboardResult({ error: (data as { error?: string }).error ?? "Failed" });
      else setEncounterLeaderboardResult(data);
    } catch {
      setEncounterLeaderboardResult({ error: "Request failed" });
    } finally {
      setEncounterLeaderboardLoading(false);
    }
  }

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/world/zones")
      .then((res) => res.ok ? res.json() : [])
      .then((data: ZoneOption[]) => setZones(Array.isArray(data) ? data : []))
      .catch(() => setZones([]));
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setFflogsUser(data))
      .catch(() => setFflogsUser(null));
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/rate-limit")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRateLimit(data))
      .catch(() => setRateLimit(null));
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/progress-race")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProgressRace(data))
      .catch(() => setProgressRace(null));
  }, [fflogsLinked, fflogsConfigured]);

  async function loadComposition() {
    if (!fflogsLinked) return;
    setCompositionLoading(true);
    setCompositionError(null);
    try {
      const pr = progressRace as Record<string, unknown> | null;
      const params = new URLSearchParams();
      if (pr?.competitionID != null) params.set("competitionID", String(pr.competitionID));
      if (pr?.guildID != null) params.set("guildID", String(pr.guildID));
      if (pr?.guildName != null && typeof pr.guildName === "string") params.set("guildName", pr.guildName);
      const url = `/api/fflogs/progress-race/composition?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to load composition");
      setComposition(data);
    } catch (e) {
      setCompositionError(e instanceof Error ? e.message : "Failed to load composition");
      setComposition(null);
    } finally {
      setCompositionLoading(false);
    }
  }

  function toggleComposition() {
    setCompositionOpen((prev) => !prev);
  }

  useEffect(() => {
    if (compositionOpen && composition == null && !compositionLoading && fflogsLinked) {
      loadComposition();
    }
  }, [compositionOpen]);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/world/expansions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: number; name?: string }[]) => setExpansions(Array.isArray(data) ? data : []))
      .catch(() => setExpansions([]));
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    if (!selectedExpansionId || !fflogsLinked) {
      setExpansionZones([]);
      setSelectedZoneId("");
      setZoneDetail(null);
      return;
    }
    fetch(`/api/fflogs/world/expansions/${selectedExpansionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { zones?: { id: number; name?: string }[] } | null) => {
        const list = data?.zones ?? [];
        setExpansionZones(Array.isArray(list) ? list : []);
      })
      .catch(() => setExpansionZones([]));
    setSelectedZoneId("");
    setZoneDetail(null);
  }, [selectedExpansionId, fflogsLinked]);

  useEffect(() => {
    if (!selectedZoneId || !fflogsLinked) {
      setZoneDetail(null);
      setEncounterDetail(null);
      setSelectedEncounterId("");
      return;
    }
    setZoneDetailLoading(true);
    fetch(`/api/fflogs/world/zone/${selectedZoneId}?detail=1`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setZoneDetail(null);
        } else {
          setZoneDetail(data);
        }
      })
      .catch(() => setZoneDetail(null))
      .finally(() => setZoneDetailLoading(false));
    setEncounterDetail(null);
    setSelectedEncounterId("");
  }, [selectedZoneId, fflogsLinked]);

  useEffect(() => {
    if (!selectedEncounterId || !fflogsLinked) {
      setEncounterDetail(null);
      return;
    }
    setEncounterDetailLoading(true);
    fetch(`/api/fflogs/world/encounter/${selectedEncounterId}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setEncounterDetail(null);
        } else {
          setEncounterDetail(data);
        }
      })
      .catch(() => setEncounterDetail(null))
      .finally(() => setEncounterDetailLoading(false));
  }, [selectedEncounterId, fflogsLinked]);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    let url = "/api/fflogs/game/classes";
    const params = new URLSearchParams();
    if (classesZoneId && classesZoneId !== "all") params.set("zone_id", classesZoneId);
    if (classesFactionId && classesFactionId !== "all") params.set("faction_id", classesFactionId);
    if (params.toString()) url += `?${params.toString()}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: number; name?: string; slug?: string }[]) => setGameClasses(Array.isArray(data) ? data : []))
      .catch(() => setGameClasses([]));
  }, [fflogsLinked, fflogsConfigured, classesZoneId, classesFactionId]);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/game/factions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: number; name?: string }[]) => setGameFactions(Array.isArray(data) ? data : []))
      .catch(() => setGameFactions([]));
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    if (!fflogsLinked || !fflogsConfigured) return;
    fetch("/api/fflogs/game/abilities?limit=100")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data: { data?: { id: number; name?: string }[] }) => setGameAbilities(Array.isArray(data?.data) ? { data: data.data } : { data: [] }))
      .catch(() => setGameAbilities({ data: [] }));
  }, [fflogsLinked, fflogsConfigured]);

  useEffect(() => {
    if (!selectedClassId || !fflogsLinked) {
      setClassDetail(null);
      return;
    }
    setClassDetailLoading(true);
    fetch(`/api/fflogs/game/class/${selectedClassId}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setClassDetail(null);
        } else {
          setClassDetail(data);
        }
      })
      .catch(() => setClassDetail(null))
      .finally(() => setClassDetailLoading(false));
  }, [selectedClassId, fflogsLinked]);

  useEffect(() => {
    if (!selectedAbilityId || !fflogsLinked) {
      setAbilityDetail(null);
      return;
    }
    setAbilityDetailLoading(true);
    fetch(`/api/fflogs/game/ability/${selectedAbilityId}`)
      .then((res) => res.json())
      .then((data: unknown) => {
        if (data != null && typeof data === "object" && "error" in data) {
          setAbilityDetail(null);
        } else {
          setAbilityDetail(data);
        }
      })
      .catch(() => setAbilityDetail(null))
      .finally(() => setAbilityDetailLoading(false));
  }, [selectedAbilityId, fflogsLinked]);

  async function refreshReports() {
    if (!fflogsLinked) return;
    setReportsLoading(true);
    setReportsError(null);
    try {
      const url = buildReportsUrl({ page, limit: 50, startTime: startTime === "" ? undefined : startTime, endTime: endTime === "" ? undefined : endTime, zoneID: zoneID === "" ? undefined : zoneID });
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status === 403 ? "Link FFLogs first." : res.statusText);
      const data = await res.json();
      setReports(data.data ?? []);
    } catch (e) {
      setReportsError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setReportsLoading(false);
    }
  }

  const jobSlugs = ["astrologian", "dragoon", "monk", "ninja", "paladin", "samurai", "scholar", "warrior", "white-mage"] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Dashboard intro: welcome, health lights, optional job strip */}
      <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-4">
        <h2 className="text-lg font-semibold tracking-tight">FFLogs overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your raid data, reports, and API usage in one place.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <ApiHealthLights />
        </div>
        {fflogsLinked && (
          <p className="mt-2 text-xs text-muted-foreground">
            Use filters below to narrow by zone; link FFLogs to see private reports.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1" aria-hidden>
          {jobSlugs.map((slug) => (
            <div
              key={slug}
              className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/20"
            >
              <Image
                src={`/images/jobs/${slug}.png`}
                alt=""
                width={32}
                height={32}
                className="object-contain p-0.5"
              />
            </div>
          ))}
        </div>
      </div>

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
                {fflogsUser?.name && (
                  <p className="text-sm text-muted-foreground">
                    Logged in as <span className="font-medium text-foreground">{fflogsUser.name}</span>
                  </p>
                )}
                <p className="text-sm text-muted-foreground">View your reports, characters, and guilds below.</p>
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
        <>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Getting started:</span> Link FFLogs (done) → Open a report from the list below to view fights and parses → Use <Link href="/dashboard/fflogs/characters" className="underline hover:text-foreground">Characters</Link> or <Link href="/dashboard/fflogs/guilds" className="underline hover:text-foreground">Guilds</Link> to look up by region and server.
              </p>
            </CardContent>
          </Card>

          {/* Character page–style layout: header + 3 columns */}
          <div className="space-y-4">
            {duty && (
              <p className="text-sm text-muted-foreground">
                Filtering by duty: <span className="font-medium capitalize text-foreground">{duty}</span>
                {" · "}
                <Link href="/dashboard/fflogs" className="underline hover:text-foreground">Show all</Link>
              </p>
            )}
            <header className="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-lg font-medium text-primary">
                    {overviewCharacter?.name?.charAt(0) ?? <User className="h-7 w-7" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight">
                      {overviewCharacter?.name ?? "Select a character"}
                    </h1>
                    {profile?.characters && profile.characters.length > 1 && (
                      <Select
                        value={overviewCharacter ? String(overviewCharacter.id) : "none"}
                        onValueChange={(v) => {
                          if (v === "none") return;
                          const c = profile.characters.find((ch) => String(ch.id) === v);
                          if (c?.name && c?.server?.slug && c?.server?.region?.slug) {
                            setOverviewCharacter({
                              id: c.id,
                              name: c.name,
                              serverSlug: c.server.slug,
                              serverRegion: c.server.region.slug,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]" aria-label="Switch character">
                          <SelectValue placeholder="Character" />
                        </SelectTrigger>
                        <SelectContent>
                          {profile.characters.map((ch) => (
                            <SelectItem key={ch.id} value={String(ch.id)}>
                              {ch.name ?? `Character ${ch.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {overviewCharacter && (
                    <p className="text-sm text-muted-foreground">
                      {overviewCharacter.serverSlug} ({overviewCharacter.serverRegion})
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                {lastReportTime != null && (
                  <>
                    <span>Last update: {formatRelativeTime(lastReportTime)}</span>
                    <Button variant="ghost" size="sm" onClick={loadReports} disabled={reportsLoading}>
                      <RefreshCw className={`h-4 w-4 ${reportsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </>
                )}
              </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr] xl:grid-cols-[2fr_1fr_0.8fr]">
              {/* Left: Performance metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={overviewZoneId || "none"}
                      onValueChange={(v) => setOverviewZoneId(v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="w-[160px]" aria-label="Raid tier / zone">
                        <SelectValue placeholder="Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select zone</SelectItem>
                        {filteredZones.map((z) => (
                          <SelectItem key={z.id} value={String(z.id)}>
                            {z.name ?? `Zone ${z.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={overviewMetric} onValueChange={setOverviewMetric}>
                      <SelectTrigger className="w-[120px]" aria-label="Metric">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dps">Damage</SelectItem>
                        <SelectItem value="hps">Healing</SelectItem>
                        <SelectItem value="tanks">Tanks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CardTitle className="text-base pt-2">Performance</CardTitle>
                  <CardDescription>
                    {overviewCharacter
                      ? "Zone rankings for the selected character. Choose a zone above."
                      : "Link FFLogs and have at least one report to see your character here."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!overviewCharacter && (
                    <p className="text-sm text-muted-foreground py-4">No character selected. Upload a report to FFLogs to get a default character.</p>
                  )}
                  {overviewCharacter && !overviewZoneId && (
                    <p className="text-sm text-muted-foreground py-4">Select a zone (raid tier) to load rankings.</p>
                  )}
                  {overviewCharacter && overviewZoneId && (
                    <>
                      {characterRankingsError && (
                        <p className="text-sm text-destructive py-2">{characterRankingsError}</p>
                      )}
                      {characterRankingsLoading && (
                        <p className="text-sm text-muted-foreground py-4">Loading rankings…</p>
                      )}
                      {!characterRankingsLoading && characterRankings != null && (
                        <RankingsTable data={characterRankings} />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Center: Character info & gear */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Character info</CardTitle>
                  <CardDescription>Playstyle and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewCharacter ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {overviewCharacter.name} — view detailed playstyle and recruitment on{" "}
                        <a
                          href={`https://www.fflogs.com/character/${overviewCharacter.serverRegion}/${overviewCharacter.serverSlug}/${encodeURIComponent(overviewCharacter.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          FFLogs
                        </a>.
                      </p>
                      <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">Gear (Lodestone)</p>
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
                        {characterGameDataError && (
                          <p className="text-xs text-destructive">{characterGameDataError}</p>
                        )}
                        {characterGameDataLoading && characterGameData == null && !characterGameDataError && (
                          <p className="text-muted-foreground text-xs">Loading cached gear/job data…</p>
                        )}
                        {characterGameData != null && !characterGameDataLoading && (
                          (characterGameData as { source?: string })?.source === "lodestone" ? (
                            <LodestoneCharacterCard data={characterGameData as { source?: string; classJobs?: { name?: string; level?: number }[] }} />
                          ) : (
                            <pre className="max-h-32 overflow-auto text-xs bg-background/50 rounded p-2">
                              {typeof characterGameData === "object"
                                ? JSON.stringify(characterGameData, null, 2)
                                : String(characterGameData)}
                            </pre>
                          )
                        )}
                        {characterGameData == null && !characterGameDataLoading && !characterGameDataError && (
                          <p className="text-muted-foreground text-xs">No cached Lodestone data. Click &quot;Refresh from Lodestone&quot; above to fetch (or view on FFLogs).</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a character to see info.</p>
                  )}
                </CardContent>
              </Card>

              {/* Right: Character model placeholder */}
              <Card className="hidden xl:block">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 w-full aspect-[3/4] max-w-[200px] flex items-center justify-center">
                    <span className="text-xs text-muted-foreground text-center px-2">Character model</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">View on FFLogs for 3D model</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card id="encounter-rankings">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Encounter leaderboards</CardTitle>
                </div>
                <CardDescription>
                  Public rankings for a single encounter. Enter encounter ID (from zone detail).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Encounter ID"
                    value={encounterLeaderboardId}
                    onChange={(e) => setEncounterLeaderboardId(e.target.value)}
                    className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
                    aria-label="Encounter ID"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadEncounterLeaderboard("character")}
                    disabled={encounterLeaderboardLoading}
                  >
                    Character rankings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadEncounterLeaderboard("fight")}
                    disabled={encounterLeaderboardLoading}
                  >
                    Fight rankings
                  </Button>
                </div>
                {encounterLeaderboardResult != null && (
                  <pre className="max-h-48 overflow-auto rounded-md border bg-muted/50 p-2 text-xs">
                    {typeof encounterLeaderboardResult === "object"
                      ? JSON.stringify(encounterLeaderboardResult, null, 2)
                      : String(encounterLeaderboardResult)}
                  </pre>
                )}
              </CardContent>
            </Card>
            <Card id="api-usage">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">API usage</CardTitle>
                </div>
                <CardDescription>
                  FFLogs API rate limit (points per hour).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rateLimit != null && typeof rateLimit === "object" ? (
                  <p className="text-sm">
                    <span className="font-medium">
                      {String((rateLimit as Record<string, unknown>).pointsSpentThisHour ?? (rateLimit as Record<string, unknown>).points_spent_this_hour ?? 0)}
                    </span>
                    {" / "}
                    <span>{String((rateLimit as Record<string, unknown>).limitPerHour ?? (rateLimit as Record<string, unknown>).limit_per_hour ?? "—")}</span> points this hour
                    {((rateLimit as Record<string, unknown>).pointsResetIn ?? (rateLimit as Record<string, unknown>).points_reset_in) != null && (
                      <span className="text-muted-foreground"> · resets in {String((rateLimit as Record<string, unknown>).pointsResetIn ?? (rateLimit as Record<string, unknown>).points_reset_in)}s</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No rate limit data.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">World race</CardTitle>
                </div>
                <CardDescription>
                  Active world or realm first progression race.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {progressRace != null && typeof progressRace === "object" && Object.keys(progressRace as object).length > 0 ? (
                  <>
                    <p className="text-sm">Race data available. Check FFLogs for standings.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleComposition}
                      disabled={compositionLoading}
                      aria-expanded={compositionOpen}
                      aria-label={compositionOpen ? "Hide composition" : "View composition"}
                    >
                      {compositionLoading ? "Loading…" : compositionOpen ? "Hide composition" : "View composition"}
                    </Button>
                    {compositionOpen && (
                      <div className="rounded-md border bg-muted/30 p-3 text-sm">
                        {compositionLoading && composition == null && (
                          <p className="text-muted-foreground">Loading composition…</p>
                        )}
                        {compositionError && (
                          <p className="text-destructive">{compositionError}</p>
                        )}
                        {composition != null && !compositionLoading && (
                          <pre className="max-h-48 overflow-auto text-xs">
                            {JSON.stringify(composition, null, 2)}
                          </pre>
                        )}
                        {composition != null && Object.keys(composition as object).length === 0 && (
                          <p className="text-muted-foreground">No composition data.</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active race.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">World / Zones</CardTitle>
              </div>
              <CardDescription>
                Expansions, zones, and encounter reference. Select an expansion to see its zones, then a zone for detail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="expansion-select" className="text-sm text-muted-foreground sr-only">Expansion</label>
                <Select value={selectedExpansionId} onValueChange={setSelectedExpansionId}>
                  <SelectTrigger id="expansion-select" className="w-[200px]" aria-label="Select expansion">
                    <SelectValue placeholder="Select expansion" />
                  </SelectTrigger>
                  <SelectContent>
                    {expansions.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.name ?? `Expansion ${e.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedExpansionId && (
                <div className="space-y-2">
                  <label htmlFor="zone-select" className="text-sm text-muted-foreground">Zones</label>
                  <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                    <SelectTrigger id="zone-select" className="w-[220px]" aria-label="Select zone">
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {expansionZones.map((z) => (
                        <SelectItem key={z.id} value={String(z.id)}>
                          {z.name ?? `Zone ${z.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {zoneDetailLoading && (
                <p className="text-sm text-muted-foreground">Loading zone detail…</p>
              )}
              {zoneDetail != null && !zoneDetailLoading && (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Zone detail</p>
                  <pre className="max-h-40 overflow-auto text-xs">
                    {JSON.stringify(zoneDetail, null, 2)}
                  </pre>
                  {((zoneDetail as { encounters?: { id: number; name?: string }[] })?.encounters?.length ?? 0) > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Encounters</p>
                      <ul className="flex flex-wrap gap-1" role="list">
                        {((zoneDetail as { encounters?: { id: number; name?: string }[] }).encounters ?? []).map((enc) => (
                          <li key={enc.id}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setSelectedEncounterId(selectedEncounterId === String(enc.id) ? "" : String(enc.id))}
                              aria-pressed={selectedEncounterId === String(enc.id)}
                              aria-label={`View encounter ${enc.name ?? enc.id}`}
                            >
                              {enc.name ?? `Encounter ${enc.id}`}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {encounterDetailLoading && (
                <p className="text-sm text-muted-foreground">Loading encounter…</p>
              )}
              {encounterDetail != null && !encounterDetailLoading && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Swords className="h-4 w-4" />
                    Encounter detail
                  </p>
                  <pre className="max-h-48 overflow-auto text-xs mt-2">
                    {JSON.stringify(encounterDetail, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Game data</CardTitle>
              </div>
              <CardDescription>
                Reference: jobs (classes), factions, and abilities. View details by clicking an item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="classes" className="w-full">
                <TabsList className="grid w-full grid-cols-3" aria-label="Game data sections">
                  <TabsTrigger value="classes">Classes</TabsTrigger>
                  <TabsTrigger value="factions">Factions</TabsTrigger>
                  <TabsTrigger value="abilities">Abilities</TabsTrigger>
                </TabsList>
                <TabsContent value="classes" className="space-y-3 pt-3">
                  <div className="flex flex-wrap gap-2">
                    <Select value={classesZoneId} onValueChange={setClassesZoneId}>
                      <SelectTrigger className="w-[140px]" aria-label="Filter classes by zone">
                        <SelectValue placeholder="Zone (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All zones</SelectItem>
                        {filteredZones.map((z) => (
                          <SelectItem key={z.id} value={String(z.id)}>{z.name ?? `Zone ${z.id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={classesFactionId} onValueChange={setClassesFactionId}>
                      <SelectTrigger className="w-[140px]" aria-label="Filter classes by faction">
                        <SelectValue placeholder="Faction (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All factions</SelectItem>
                        {gameFactions.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>{f.name ?? `Faction ${f.id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ul className="flex flex-wrap gap-1" role="list">
                    {gameClasses.map((c) => (
                      <li key={c.id}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedClassId(selectedClassId === String(c.id) ? "" : String(c.id))}
                          aria-pressed={selectedClassId === String(c.id)}
                          aria-label={`View class ${c.name ?? c.id}`}
                        >
                          {c.name ?? c.slug ?? `Class ${c.id}`}
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {classDetailLoading && <p className="text-sm text-muted-foreground">Loading class…</p>}
                  {classDetail != null && !classDetailLoading && (
                    <pre className="max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 text-xs">
                      {JSON.stringify(classDetail, null, 2)}
                    </pre>
                  )}
                </TabsContent>
                <TabsContent value="factions" className="pt-3">
                  <ul className="flex flex-wrap gap-1" role="list">
                    {gameFactions.map((f) => (
                      <li key={f.id}>
                        <span className="inline-flex items-center rounded-md border bg-muted/30 px-2 py-1 text-sm">
                          {f.name ?? `Faction ${f.id}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {gameFactions.length === 0 && (
                    <p className="text-sm text-muted-foreground">No factions loaded.</p>
                  )}
                </TabsContent>
                <TabsContent value="abilities" className="space-y-3 pt-3">
                  <ul className="flex flex-wrap gap-1 max-h-32 overflow-auto" role="list">
                    {(gameAbilities?.data ?? []).map((a) => (
                      <li key={a.id}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedAbilityId(selectedAbilityId === String(a.id) ? "" : String(a.id))}
                          aria-pressed={selectedAbilityId === String(a.id)}
                          aria-label={`View ability ${a.name ?? a.id}`}
                        >
                          {a.name ?? `Ability ${a.id}`}
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {abilityDetailLoading && <p className="text-sm text-muted-foreground">Loading ability…</p>}
                  {abilityDetail != null && !abilityDetailLoading && (
                    <pre className="max-h-40 overflow-auto rounded-md border bg-muted/50 p-2 text-xs">
                      {JSON.stringify(abilityDetail, null, 2)}
                    </pre>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card id="reports">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
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
              Reports from your linked FFLogs account. Select reports and use &quot;Import for AI&quot; to download them for custom analytics and Discord reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllReports}
                disabled={reports.length === 0}
              >
                Select all on page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearReportSelection}
                disabled={selectedReportCodes.size === 0}
              >
                Clear selection
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={runImportForAI}
                disabled={selectedReportCodes.size === 0 || importLoading}
              >
                {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {importLoading ? " Importing…" : " Import for AI"}
              </Button>
              <Select
                value={zoneID === "" ? "all" : String(zoneID)}
                onValueChange={(v) => setZoneID(v === "all" ? "" : Number(v))}
              >
                <SelectTrigger className="w-[200px]" aria-label="Filter reports by zone">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All zones</SelectItem>
                  {filteredZones.map((z) => (
                    <SelectItem key={z.id} value={String(z.id)}>{z.name ?? `Zone ${z.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="number"
                placeholder="Start (ms)"
                className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm"
                value={startTime === "" ? "" : startTime}
                onChange={(e) => setStartTime(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <input
                type="number"
                placeholder="End (ms)"
                className="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm"
                value={endTime === "" ? "" : endTime}
                onChange={(e) => setEndTime(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <Button variant="secondary" size="sm" onClick={() => { setPage(1); loadReports(); }}>
                Apply filters
              </Button>
            </div>
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
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
                  <li key={r.code} className="flex items-center gap-2">
                    <Checkbox
                      id={`report-${r.code}`}
                      checked={selectedReportCodes.has(r.code)}
                      onCheckedChange={() => toggleReportSelection(r.code)}
                      aria-label={`Select report ${r.title || r.code}`}
                    />
                    <Link
                      href={`/reports/${r.code}`}
                      className="flex-1 block rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                      aria-label={`View report: ${r.title || r.code}`}
                    >
                      <span className="font-medium">{r.title || r.code}</span>
                      <span className="ml-2 text-muted-foreground">
                        {new Date(r.startTime).toLocaleDateString()}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">· View report</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {fflogsLinked && (
          <Card id="import-progress">
            <CardHeader>
              <CardTitle className="text-base">Import progress</CardTitle>
              <CardDescription>
                Jobs for &quot;Import for AI&quot;. Status updates in real time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importJobsLoading && importJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : importJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No import jobs yet. Select reports above and click &quot;Import for AI&quot;.</p>
              ) : (
                <ul className="space-y-2">
                  {importJobs.map((j) => (
                    <li key={j.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">{j.report_code}</span>
                      <span className="text-muted-foreground">
                        {j.status === "queued" && "Queued"}
                        {j.status === "running" && "Processing…"}
                        {j.status === "done" && "Done"}
                        {j.status === "failed" && "Failed"}
                      </span>
                      {j.last_error && <span className="text-destructive text-xs">{j.last_error}</span>}
                      <span className="text-xs text-muted-foreground">
                        {Array.isArray(j.fight_ids) ? j.fight_ids.length : 0} fights
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        </>
      )}
    </div>
  );
}
