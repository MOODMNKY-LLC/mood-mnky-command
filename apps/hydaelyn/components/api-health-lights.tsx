"use client";

import { useEffect, useState } from "react";
import type { HealthResponse } from "@/app/api/health/route";

type ServiceStatus = HealthResponse["fflogs"];

function Light({ status, label }: { status: ServiceStatus; label: string }) {
  const title =
    status === "ok"
      ? `${label}: OK`
      : status === "unconfigured"
        ? `${label}: Not configured`
        : `${label}: Error`;

  return (
    <span className="inline-flex items-center gap-1.5" title={title}>
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          status === "ok"
            ? "bg-emerald-500"
            : status === "unconfigured"
              ? "bg-muted-foreground/50"
              : "bg-destructive"
        }`}
        aria-hidden
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}

export function ApiHealthLights({ className = "" }: { className?: string }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: HealthResponse | null) => {
        if (!cancelled && data) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth({ fflogs: "error", supabase: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-3 text-muted-foreground ${className}`}>
        <span className="text-xs">Services:</span>
        <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/50" />
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="text-xs text-muted-foreground">Services:</span>
      <Light status={health.fflogs} label="FFLogs" />
      <Light status={health.supabase} label="Supabase" />
    </div>
  );
}
