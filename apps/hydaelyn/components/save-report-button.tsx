"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, AlertCircle } from "lucide-react";

type SaveResult = {
  saved: boolean;
  verified?: boolean;
  detail?: boolean;
  table?: boolean;
  events?: boolean;
  error?: string;
};

export function SaveReportButton({ reportCode }: { reportCode: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  async function handleSave() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/fflogs/reports/${reportCode}/save`, {
        method: "POST",
      });
      const data = (await res.json()) as SaveResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setResult({
        saved: data.saved,
        verified: data.verified,
        detail: data.detail,
        table: data.table,
        events: data.events,
      });
    } catch (e) {
      setResult({
        saved: false,
        verified: false,
        error: e instanceof Error ? e.message : "Save failed",
      });
    } finally {
      setLoading(false);
    }
  }

  const saved = result?.saved ?? false;
  const verified = result?.verified ?? false;
  const error = result?.error;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={loading}
        aria-label="Save report to library"
      >
        <Download className="mr-1.5 h-4 w-4" />
        {loading ? "Saving…" : saved ? "Saved" : "Save report to library"}
      </Button>
      {result && !error && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {verified ? (
            <Check className="h-3.5 w-3.5 text-green-600" aria-hidden />
          ) : result.saved ? (
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden />
          ) : null}
          {result.saved && (
            <>
              {verified ? "Verified in cache" : "Saved; refresh to confirm"}
              {(result.detail || result.table || result.events) && (
                <span className="text-muted-foreground/80">
                  (detail{result.detail ? " ✓" : ""} table{result.table ? " ✓" : ""} events{result.events ? " ✓" : ""})
                </span>
              )}
            </>
          )}
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </span>
      )}
    </div>
  );
}
