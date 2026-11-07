import {
  ILLUSTRATIVE_PRIVATE_SERVICE_STATES,
  type PrivateServicePreviewStatus,
} from "@/lib/private-services/preview-states"
import { getVipPortalLink } from "@/lib/mnky-id"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<PrivateServicePreviewStatus, string> = {
  request: "Request",
  pending: "Pending",
  approved: "Approved",
  provisioning: "Provisioning",
  active: "Active",
  revoked: "Revoked",
  error: "Error",
  unavailable: "Unavailable",
}

function statusClass(status: PrivateServicePreviewStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    case "approved":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300"
    case "pending":
    case "provisioning":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200"
    case "revoked":
    case "error":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300"
    case "request":
      return "bg-muted text-muted-foreground"
    case "unavailable":
      return "bg-muted text-muted-foreground"
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

/**
 * Lightweight member-home panel connecting Dojo life to private-service states.
 * All rows are illustrative unless a live VIP deep-link is config-enabled.
 */
export function DojoPrivateServicesPreview() {
  const vip = getVipPortalLink()

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm"
      aria-labelledby="private-services-preview-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Preview · illustrative
          </p>
          <h2
            id="private-services-preview-heading"
            className="mt-1 text-lg font-semibold tracking-tight"
          >
            Private services
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            MNKY ID unlocks the private VERSE portal when you create one.
            Packages still need separate approval. These rows are{" "}
            <strong className="font-medium text-foreground">not live grants</strong>
            .
          </p>
        </div>
        {vip.enabled ? (
          <a
            href={vip.url}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background"
            rel="noopener noreferrer"
            target="_blank"
          >
            Open private VERSE
          </a>
        ) : (
          <span className="rounded-full border border-dashed border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            VIP deep-link off
          </span>
        )}
      </div>

      <ul className="mt-5 space-y-3">
        {ILLUSTRATIVE_PRIVATE_SERVICE_STATES.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.summary}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                statusClass(item.status),
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
