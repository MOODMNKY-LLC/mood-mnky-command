"use client";

import { getJobIconPath } from "@/lib/job-icons";

export function JobIcon({
  job,
  className,
  size = 24,
  showName = false,
}: {
  job: string | null | undefined;
  className?: string;
  size?: number;
  showName?: boolean;
}) {
  const src = getJobIconPath(job);
  const name = job ?? "—";

  if (src) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="shrink-0 rounded"
        />
        {showName && <span>{name}</span>}
      </span>
    );
  }

  return showName ? <span>{name}</span> : <span className="text-muted-foreground">{name}</span>;
}
