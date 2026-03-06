"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EncounterSnapshot, OverlayTheme, MinimizedSide } from "./types";
import { parseCombatants, getSampleCombatData } from "./utils";
import { ParseTab } from "./components/parse-tab";
import { MetricsTab } from "./components/metrics-tab";
import { OverlaySettings } from "./components/overlay-settings";
import { EncounterHistory, MAX_ENCOUNTERS } from "./components/encounter-history";
import { SpellTimersTab } from "./components/spell-timers-tab";

const OVERLAY_SCRIPT = "/overlay-plugin-common.min.js";
const THROTTLE_MS = 5000;

type IngestStatus = "idle" | "sending" | "ok" | "error";

function makeSnapshot(
  Encounter: Record<string, unknown>,
  Combatant: Record<string, unknown>,
  zoneID?: number
): EncounterSnapshot {
  const combatants = parseCombatants(Combatant as Record<string, unknown>);
  const title = String(Encounter?.title ?? Encounter?.Title ?? "");
  return {
    id: `enc-${Date.now()}`,
    title,
    combatants,
    at: Date.now(),
    Encounter,
    Combatant,
    zoneID,
  };
}

export default function OverlayActPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pluginReady, setPluginReady] = useState(false);
  const [pluginError, setPluginError] = useState(false);
  const [encounters, setEncounters] = useState<EncounterSnapshot[]>([]);
  const [currentEncounterIndex, setCurrentEncounterIndex] = useState(0);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus>("idle");
  const [ingestMessage, setIngestMessage] = useState("");
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [theme, setTheme] = useState<OverlayTheme>("classic");
  const [collapsed, setCollapsed] = useState(false);
  const [nameBlur, setNameBlur] = useState(false);
  const [minimized, setMinimized] = useState<MinimizedSide>("none");
  const lastSendRef = useRef(0);
  const sendToIngestRef = useRef<
    (payload: {
      Encounter?: Record<string, unknown>;
      Combatant?: Record<string, unknown>;
      zoneID?: number;
    }) => void
  >(() => {});

  const ingestUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(/\/$/, "")}/api/ingest/combat`
      : "";

  const sendToIngest = useCallback(
    (payload: {
      Encounter?: Record<string, unknown>;
      Combatant?: Record<string, unknown>;
      zoneID?: number;
    }) => {
      if (!token) return;
      const now = Date.now();
      if (now - lastSendRef.current < THROTTLE_MS) return;
      lastSendRef.current = now;

      setIngestStatus("sending");
      setIngestMessage("Sending…");
      fetch(ingestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overlay_token: token,
          encounter: payload.Encounter ?? {},
          combatants: payload.Combatant ?? {},
          zone_id:
            payload.zoneID != null ? String(payload.zoneID) : undefined,
        }),
      })
        .then((res) => {
          if (res.ok) {
            setIngestStatus("ok");
            setIngestMessage("Last sent: just now");
          } else {
            setIngestStatus("error");
            setIngestMessage(
              `Failed: ${res.status}${res.status === 401 ? " (invalid token?)" : ""}`
            );
          }
        })
        .catch(() => {
          setIngestStatus("error");
          setIngestMessage("Network error");
        });
    },
    [token, ingestUrl]
  );
  sendToIngestRef.current = sendToIngest;

  useEffect(() => {
    if (typeof addOverlayListener !== "undefined") {
      setPluginReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = OVERLAY_SCRIPT;
    script.async = true;
    script.onload = () => setPluginReady(true);
    script.onerror = () => setPluginError(true);
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    if (!pluginReady || typeof addOverlayListener === "undefined") return;

    const onCombatData = (data: unknown) => {
      const d = data as {
        Encounter?: Record<string, unknown>;
        Combatant?: Record<string, unknown>;
        zoneID?: number;
      };
      if (!d) return;
      setHasReceivedData(true);
      const enc = d.Encounter ?? {};
      const comb = (d.Combatant ?? {}) as Record<string, unknown>;
      const snapshot = makeSnapshot(enc, comb, d.zoneID);
      setEncounters((prev) => {
        const next = [snapshot, ...prev].slice(0, MAX_ENCOUNTERS);
        return next;
      });
      setCurrentEncounterIndex(0);
      sendToIngestRef.current(d);
    };

    addOverlayListener("CombatData", onCombatData);
    // Let OverlayPlugin (CEF-injected API) finish wiring before we subscribe
    const t = window.setTimeout(() => {
      if (typeof startOverlayEvents === "function") startOverlayEvents();
    }, 0);

    if (token) {
      setIngestStatus("idle");
      setIngestMessage("Awaiting encounter data…");
    }

    return () => {
      window.clearTimeout(t);
      if (typeof removeOverlayListener === "function")
        removeOverlayListener("CombatData", onCombatData);
    };
  }, [pluginReady, token]);

  const copyToken = () => {
    if (token && navigator.clipboard) navigator.clipboard.writeText(token);
  };

  const hasWs =
    typeof window !== "undefined" &&
    (searchParams.has("OVERLAY_WS") || searchParams.has("HOST_PORT"));
  const hasHostPort =
    typeof window !== "undefined" && searchParams.has("HOST_PORT");

  const currentEncounter =
    encounters.length > 0 && currentEncounterIndex < encounters.length
      ? encounters[currentEncounterIndex]
      : null;
  const combatants = currentEncounter?.combatants ?? [];
  const encounterTitle = currentEncounter?.title ?? "";

  const handleClear = () => {
    setEncounters([]);
    setCurrentEncounterIndex(0);
  };

  const handleLoadSample = () => {
    const sample = getSampleCombatData();
    const snapshot = makeSnapshot(
      sample.Encounter,
      sample.Combatant,
      sample.zoneID
    );
    setEncounters((prev) => [snapshot, ...prev].slice(0, MAX_ENCOUNTERS));
    setCurrentEncounterIndex(0);
  };

  const themeClass =
    theme === "light"
      ? "bg-gray-100 text-gray-900"
      : theme === "minimal"
        ? "bg-black/95 text-white"
        : "bg-black/90 text-white";

  if (minimized !== "none") {
    return (
      <div
        className={`fixed top-0 bottom-0 z-50 flex items-center ${minimized === "left" ? "left-0" : "right-0"} ${themeClass}`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => setMinimized("none")}
          aria-label="Expand overlay"
        >
          {minimized === "left" ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 font-sans ${themeClass}`}
      data-overlay-theme={theme}
    >
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Hydaelyn ACT Overlay</h1>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:bg-white/10"
            onClick={() => setMinimized("left")}
            aria-label="Minimize left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:bg-white/10"
            onClick={() => setMinimized("right")}
            aria-label="Minimize right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {pluginError && (
        <p className="text-destructive mb-2">
          OverlayPlugin script failed to load. Check network or try adding
          ?OVERLAY_WS=ws://127.0.0.1:10501/ws
        </p>
      )}

      {!token && (
        <p className="text-muted-foreground mb-4">
          Add ?token=YOUR_OVERLAY_TOKEN to the URL (from the dashboard).
        </p>
      )}

      {pluginReady && token && (
        <div className="mb-4 rounded border border-white/20 bg-white/5 p-3 text-sm">
          <p className="font-medium text-white/90">
            {hasReceivedData ? (
              <span className="text-green-400">Receiving encounter data</span>
            ) : (
              "No encounter data yet"
            )}
          </p>
          <p className="mt-1 text-white/60">
            {hasReceivedData
              ? "CombatData is flowing from ACT. Parse table and ingest will update."
              : hasWs
                ? "WSServer param is set. Is ACT running, WSServer started, and game in combat?"
                : "Load this URL inside OverlayPlugin (ACT) as an overlay tab, or open in browser/OBS and add &OVERLAY_WS=ws://127.0.0.1:10501/ws and start WSServer in ACT."}
          </p>
          <p className="mt-1 text-xs text-white/40">
            Host (localhost vs production) does not affect receiving data — only where you open this page (ACT vs browser) and OVERLAY_WS when in browser.
          </p>
          {hasHostPort && !hasReceivedData && (
            <p className="mt-1 text-xs text-amber-200/90">
              In ACT: add this URL as a new overlay tab (same way as Ember). Ensure the FFXIV plugin is enabled and you are in game; CombatData is sent once per second while in combat.
            </p>
          )}
        </div>
      )}

      {pluginReady && token && (
        <EncounterHistory
          encounters={encounters}
          currentIndex={currentEncounterIndex}
          onSelectIndex={setCurrentEncounterIndex}
          onClear={handleClear}
          onLoadSample={handleLoadSample}
        />
      )}

      {pluginReady && token && !collapsed && (
        <Tabs defaultValue="parse" className="w-full max-w-2xl">
          <TabsList className="mb-2 flex h-auto flex-wrap gap-1 bg-white/10 p-1">
            <TabsTrigger value="parse">Parse</TabsTrigger>
            <TabsTrigger value="healing">Healing</TabsTrigger>
            <TabsTrigger value="tanking">Tanking</TabsTrigger>
            <TabsTrigger value="raiding">Raiding</TabsTrigger>
            <TabsTrigger value="aggro">Aggro</TabsTrigger>
            <TabsTrigger value="timers">Timers</TabsTrigger>
            <TabsTrigger value="ingest">Ingest</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="parse">
            <ParseTab
              encounterTitle={encounterTitle}
              combatants={combatants}
              nameBlur={nameBlur}
            />
          </TabsContent>
          <TabsContent value="healing">
            <MetricsTab
              combatants={combatants}
              mode="healing"
              nameBlur={nameBlur}
            />
          </TabsContent>
          <TabsContent value="tanking">
            <MetricsTab
              combatants={combatants}
              mode="tanking"
              nameBlur={nameBlur}
            />
          </TabsContent>
          <TabsContent value="raiding">
            <MetricsTab
              combatants={combatants}
              mode="raiding"
              nameBlur={nameBlur}
            />
          </TabsContent>
          <TabsContent value="aggro">
            <MetricsTab
              combatants={combatants}
              mode="aggro"
              nameBlur={nameBlur}
            />
          </TabsContent>
          <TabsContent value="timers">
            <SpellTimersTab />
          </TabsContent>
          <TabsContent value="ingest" className="mt-3">
            <p
              className={
                ingestStatus === "ok"
                  ? "text-green-500"
                  : ingestStatus === "error"
                    ? "text-red-400"
                    : ingestStatus === "sending"
                      ? "text-yellow-400"
                      : "text-white/80"
              }
            >
              {ingestMessage}
            </p>
            <p className="text-xs text-white/50 mt-2">
              Combat data is sent to Hydaelyn every 5s while in combat.
            </p>
          </TabsContent>
          <TabsContent value="settings">
            <OverlaySettings
              token={token}
              theme={theme}
              onThemeChange={setTheme}
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
              nameBlur={nameBlur}
              onNameBlurChange={setNameBlur}
              hasWs={hasWs}
              hasHostPort={hasHostPort}
              onCopyToken={copyToken}
            />
          </TabsContent>
        </Tabs>
      )}

      {pluginReady && token && collapsed && (
        <p className="text-sm text-white/60">
          Panel collapsed. Toggle in Settings to expand.
        </p>
      )}

      {pluginReady && !token && (
        <p className="text-sm text-white/60">
          Get your overlay token from the dashboard, then add it to this URL.
        </p>
      )}
    </div>
  );
}
