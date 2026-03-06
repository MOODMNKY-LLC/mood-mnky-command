"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 30000;

type Stats = {
  found?: boolean;
  pull_count: number;
  best_pull_duration_sec: number | null;
  best_pull_dps: number | null;
  last_encounter_title: string | null;
  last_encounter_duration: number | null;
  last_encounter_dps: number | null;
  session_name: string | null;
} | null;

function formatDuration(sec: number | null): string {
  if (sec == null || Number.isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

function formatDps(dps: number | null): string {
  if (dps == null || Number.isNaN(dps)) return "—";
  if (dps >= 1e6) return (dps / 1e6).toFixed(1) + "M";
  if (dps >= 1e3) return (dps / 1e3).toFixed(1) + "k";
  return Math.round(dps).toString();
}

export default function OverlayStreamPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";
  const showEscHint = searchParams.get("hideHint") !== "1";
  const [stats, setStats] = useState<Stats>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (typeof window === "undefined") return;
      if (window.opener) {
        window.close();
      } else {
        window.location.href = "/dashboard/live";
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!token) {
      setStats(null);
      setError("Missing token");
      return;
    }
    setError(null);

    const fetchStats = () => {
      fetch(`/api/sessions/${encodeURIComponent(token)}/stats`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load stats");
          return res.json();
        })
        .then((data) => {
          setStats(data);
          setError(null);
        })
        .catch(() => setError("Failed to load"));
    };

    fetchStats();
    const pollId = setInterval(fetchStats, POLL_MS);

    let supabase: ReturnType<typeof createClient> | null = null;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    try {
      supabase = createClient();
      channel = supabase.channel(`overlay:${token}`, {
        config: { broadcast: { self: false } },
      });
      channel
        .on("broadcast", { event: "stats_updated" }, () => {
          fetchStats();
        })
        .subscribe();
    } catch {
      // Realtime optional; poll continues
    }

    return () => {
      clearInterval(pollId);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [token ?? ""]);

  const isDark = theme === "dark";

  return (
    <div
      className="min-h-screen bg-transparent p-4 font-sans select-none"
      style={{
        background: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)",
        color: isDark ? "#e0e0e0" : "#1a1a1a",
      }}
    >
      {!token && (
        <p className="text-lg">Add ?token=YOUR_OVERLAY_TOKEN to the URL.</p>
      )}
      {token && error && (
        <p className="text-lg">{error}</p>
      )}
      {token && !error && stats && stats.found === false && (
        <p className="text-lg opacity-90">
          No stream session for this token. Create one in Dashboard → Live.
        </p>
      )}
      {token && !error && stats && stats.found !== false && (
        <div className="flex flex-col gap-2 text-left">
          <div className="text-2xl font-semibold">
            Pulls: {stats.pull_count}
          </div>
          <div className="text-xl">
            Best: {formatDuration(stats.best_pull_duration_sec)} — {formatDps(stats.best_pull_dps)} DPS
          </div>
          {stats.last_encounter_title != null && (
            <div className="text-sm opacity-80">
              Current: {stats.last_encounter_title} — {formatDuration(stats.last_encounter_duration)} — {formatDps(stats.last_encounter_dps)} DPS
            </div>
          )}
        </div>
      )}
      {showEscHint && (
        <p
          className="fixed bottom-2 right-2 text-xs opacity-50"
          style={{ color: isDark ? "#e0e0e0" : "#1a1a1a" }}
        >
          Press Esc to close
        </p>
      )}
    </div>
  );
}
