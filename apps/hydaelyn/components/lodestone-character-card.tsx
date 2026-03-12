"use client";

import { JobIcon } from "@/components/job-icon";

type ClassJob = { name?: string; level?: number; jobId?: number };

type LodestoneGameData = {
  source?: string;
  classJobs?: ClassJob[];
  raw?: unknown;
  [key: string]: unknown;
};

/**
 * Renders Lodestone character game data: ClassJobs list with job icon + name + level,
 * and an optional "Raw" details section for debugging.
 */
export function LodestoneCharacterCard({ data }: { data: LodestoneGameData | null }) {
  if (data == null) return null;
  if ((data as { source?: string }).source !== "lodestone") return null;

  const classJobs = (data as { classJobs?: ClassJob[] }).classJobs;
  const hasClassJobs = Array.isArray(classJobs) && classJobs.length > 0;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Source: Lodestone (XIVAPI)</p>
      {hasClassJobs ? (
        <>
          <div className="rounded-md border bg-muted/20 p-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Jobs</p>
            <ul className="space-y-1.5">
              {classJobs
                .filter((j) => j?.name != null)
                .map((j, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <JobIcon job={j.name} size={20} />
                    <span className="text-foreground">{j.name}</span>
                    {j.level != null && (
                      <span className="text-muted-foreground">Lv {j.level}</span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Raw JSON
            </summary>
            <pre className="mt-1 max-h-32 overflow-auto rounded border bg-background/50 p-2 text-xs">
              {typeof data === "object"
                ? JSON.stringify(data, null, 2)
                : String(data)}
            </pre>
          </details>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">No job data.</p>
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Raw JSON
            </summary>
            <pre className="mt-1 max-h-32 overflow-auto rounded border bg-background/50 p-2 text-xs">
              {typeof data === "object"
                ? JSON.stringify(data, null, 2)
                : String(data)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
