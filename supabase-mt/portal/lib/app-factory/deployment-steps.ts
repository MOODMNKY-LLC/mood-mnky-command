/**
 * Deployment progress step labels and sync helper for Coolify status + logs.
 * Kept in a separate module so "use server" actions.ts only exports async server actions.
 */

/** Ordered steps for deployment progress UI (0-based index). */
export const DEPLOYMENT_STEPS = [
  "Queued",
  "Preparing",
  "Building",
  "Deploying",
  "Live",
] as const;

export type DeploymentStepIndex = 0 | 1 | 2 | 3 | 4;

/**
 * Infer current deployment step from Coolify status and logs for a multi-step progress meter.
 * Maps status + log content to step index (0=Queued … 4=Live). Failed/cancelled stay at current step.
 */
export function getDeploymentStepFromStatusAndLogs(
  status: string,
  logs: string | null
): { stepIndex: DeploymentStepIndex; stepLabel: string } {
  const s = (status ?? "").toLowerCase().trim();
  const logTail = (logs ?? "").slice(-3000).toLowerCase();

  if (["success", "succeeded", "finished", "completed"].includes(s)) {
    return { stepIndex: 4, stepLabel: DEPLOYMENT_STEPS[4] };
  }
  if (["failed", "error", "cancelled", "cancelled-by-user"].includes(s)) {
    if (logTail.includes("build") || logTail.includes("compile") || logTail.includes("npm run build") || logTail.includes("pnpm build")) {
      return { stepIndex: 2, stepLabel: "Building (failed)" };
    }
    if (logTail.includes("install") || logTail.includes("clon") || logTail.includes("pull") || logTail.includes("fetch")) {
      return { stepIndex: 1, stepLabel: "Preparing (failed)" };
    }
    if (logTail.includes("start") || logTail.includes("deploy") || logTail.includes("container")) {
      return { stepIndex: 3, stepLabel: "Deploying (failed)" };
    }
    return { stepIndex: 1, stepLabel: "Preparing (failed)" };
  }

  if (logTail.includes("starting") || logTail.includes("deploying") || logTail.includes("container") || logTail.includes("running container")) {
    return { stepIndex: 3, stepLabel: DEPLOYMENT_STEPS[3] };
  }
  if (logTail.includes("pnpm run build") || logTail.includes("npm run build") || logTail.includes("building") || logTail.includes("compile") || logTail.includes("next build")) {
    return { stepIndex: 2, stepLabel: DEPLOYMENT_STEPS[2] };
  }
  if (logTail.includes("pnpm install") || logTail.includes("npm install") || logTail.includes("installing") || logTail.includes("dependency")) {
    return { stepIndex: 1, stepLabel: DEPLOYMENT_STEPS[1] };
  }
  if (logTail.includes("clon") || logTail.includes("pull") || logTail.includes("fetch") || logTail.includes("git") || s === "pending" || s === "in_progress" || s === "in progress") {
    return { stepIndex: 1, stepLabel: DEPLOYMENT_STEPS[1] };
  }

  if (s === "running") {
    return { stepIndex: 2, stepLabel: DEPLOYMENT_STEPS[2] };
  }
  return { stepIndex: 0, stepLabel: DEPLOYMENT_STEPS[0] };
}
