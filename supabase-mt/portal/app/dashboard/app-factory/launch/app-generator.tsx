"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerRow, TenantRow, TemplateWithVersions } from "@/lib/app-factory/data";
import { createCustomer, submitLaunchSpec, runLaunchPipeline, getCoolifyDeploymentProgress } from "@/lib/app-factory/actions";
import { DEPLOYMENT_STEPS, type DeploymentStepIndex } from "@/lib/app-factory/deployment-steps";
import { ExternalLink, CheckCircle2, Loader2 as Loader2Icon, AlertCircle, ArrowLeft, Circle } from "lucide-react";
import { TemplateCards } from "./template-cards";

const DEPLOY_POLL_INTERVAL_MS = 5_000;
const SUCCESS_STATUSES = ["success", "succeeded", "finished", "completed"];
const FAILED_STATUSES = ["failed", "error", "cancelled"];

function isTerminalSuccess(status: string): boolean {
  return SUCCESS_STATUSES.includes(status?.toLowerCase().trim() ?? "");
}
function isTerminalFailed(status: string): boolean {
  return FAILED_STATUSES.includes(status?.toLowerCase().trim() ?? "");
}
function isTerminalStatus(status: string): boolean {
  return isTerminalSuccess(status) || isTerminalFailed(status);
}

const COMPOSE_TEMPLATE_KEYS = ["agent-stack"];
function isComposeTemplate(templateKey: string): boolean {
  return COMPOSE_TEMPLATE_KEYS.includes(templateKey);
}

export type AppGeneratorInitialData = {
  customers: CustomerRow[];
  tenants: TenantRow[];
  templates: TemplateWithVersions[];
  /** Root domain for URL preview (e.g. moodmnky.com). From APP_FACTORY_ROOT_DOMAIN. */
  rootDomain?: string | null;
};

type Props = {
  credentialsReady: boolean;
  initialData: AppGeneratorInitialData;
};

export function AppGenerator({ credentialsReady, initialData }: Props) {
  const [customers, setCustomers] = useState(initialData.customers);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [templateVersionId, setTemplateVersionId] = useState<string>("");
  const [appName, setAppName] = useState("");
  const [appSlug, setAppSlug] = useState("");
  /** When true, slug is derived from app name (slugify); when false, user has overridden slug. */
  const [slugFromName, setSlugFromName] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supabaseStrategy, setSupabaseStrategy] = useState<"shared_rls" | "shared_schema" | "dedicated_project">("shared_rls");
  const [runtimeTier, setRuntimeTier] = useState<"shared_multi_tenant" | "dedicated_app_shared_host" | "dedicated_runtime">("dedicated_app_shared_host");

  const [manifestFormValues, setManifestFormValues] = useState<Record<string, string>>({});
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createCustomerPending, setCreateCustomerPending] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ project_id: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<{
    repoUrl?: string;
    applicationUuid?: string;
    message?: string;
    deploymentStatus?: string;
    deploymentUrl?: string | null;
    deploymentLogs?: string | null;
    deploymentUuid?: string | null;
  } | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [liveDeployment, setLiveDeployment] = useState<{
    status: string;
    deploymentUrl: string | null;
    logs: string | null;
    deploymentStepIndex?: DeploymentStepIndex;
    deploymentStepLabel?: string | null;
  } | null>(null);

  const selectedTemplate = initialData.templates.find((t) => t.id === templateId);
  const versions = selectedTemplate?.versions ?? [];
  const selectedVersion = versions.find((v) => v.id === templateVersionId);
  const isCompose = selectedTemplate ? isComposeTemplate(selectedTemplate.template_key) : false;

  const tenants = initialData.tenants;
  const hasTenants = tenants.length > 0;

  const handleCreateCustomer = async () => {
    if (!createCustomerName.trim()) return;
    setCreateCustomerPending(true);
    const result = await createCustomer({ name: createCustomerName.trim() });
    setCreateCustomerPending(false);
    if (result.success) {
      setCustomers((prev) => [...prev, { id: result.customer_id, name: createCustomerName.trim(), legal_name: null, status: "active", primary_contact_name: null, primary_contact_email: null, notes: null, created_at: "" }]);
      setCustomerId(result.customer_id);
      setCreateCustomerName("");
    }
  };

  const handleSubmit = async (): Promise<{ project_id: string } | null> => {
    const missing: string[] = [];
    if (!tenantId) missing.push("Tenant");
    if (!templateId) missing.push("Template");
    if (!templateVersionId) missing.push("Template version");
    if (!appName.trim()) missing.push("App name");
    if (!appSlug.trim()) missing.push("App slug");
    if (missing.length > 0) {
      setSubmitError(`Missing required: ${missing.join(", ")}.`);
      return null;
    }
    setSubmitError(null);
    setSubmitPending(true);
    const result = await submitLaunchSpec({
      customer_id: customerId,
      tenant_id: tenantId,
      template_id: templateId,
      template_version_id: templateVersionId,
      app_name: appName.trim(),
      app_slug: appSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      domain: null,
      display_name: displayName.trim() || null,
      support_email: supportEmail.trim() || null,
      supabase_strategy: supabaseStrategy,
      runtime_tier: runtimeTier,
      template_config: Object.keys(manifestFormValues).length > 0 ? manifestFormValues : null,
    });
    setSubmitPending(false);
    if (result.success) {
      setSubmitResult({ project_id: result.project_id });
      return { project_id: result.project_id };
    }
    setSubmitError(result.error);
    return null;
  };

  const handleCreateAndDeploy = async () => {
    const created = await handleSubmit();
    if (!created?.project_id) return;
    setPipelineError(null);
    setLiveDeployment(null);
    setPipelineRunning(true);
    const runResult = await runLaunchPipeline(created.project_id);
    setPipelineRunning(false);
    if (runResult.success) {
      setPipelineResult({
        repoUrl: runResult.repoUrl,
        applicationUuid: runResult.applicationUuid,
        message: runResult.message,
        deploymentStatus: runResult.deploymentStatus,
        deploymentUrl: runResult.deploymentUrl,
        deploymentLogs: runResult.deploymentLogs,
        deploymentUuid: runResult.deploymentUuid,
      });
    } else {
      setPipelineError(runResult.error);
    }
  };

  const handleTemplateSelect = (tid: string, vid: string) => {
    setTemplateId(tid);
    setTemplateVersionId(vid);
    const t = initialData.templates.find((x) => x.id === tid);
    const vers = t?.versions ?? [];
    const ver = vers.find((v) => v.id === vid) ?? vers[0];
    const manifest = ver?.manifest_json as { form_fields?: { key: string; default?: string }[] } | undefined;
    const next: Record<string, string> = {};
    manifest?.form_fields?.forEach((f) => {
      next[f.key] = (f.default as string) ?? "";
    });
    setManifestFormValues(next);
    setSubmitError(null);
  };

  const handleRunPipeline = async () => {
    if (!submitResult) return;
    setPipelineError(null);
    setLiveDeployment(null);
    setPipelineRunning(true);
    const result = await runLaunchPipeline(submitResult.project_id);
    setPipelineRunning(false);
    if (result.success) {
      setPipelineResult({
        repoUrl: result.repoUrl,
        applicationUuid: result.applicationUuid,
        message: result.message,
        deploymentStatus: result.deploymentStatus,
        deploymentUrl: result.deploymentUrl,
        deploymentLogs: result.deploymentLogs,
        deploymentUuid: result.deploymentUuid,
      });
    } else {
      setPipelineError(result.error);
    }
  };

  const appUuid = pipelineResult?.applicationUuid;
  const effectiveStatus = liveDeployment?.status ?? pipelineResult?.deploymentStatus ?? "";
  const effectiveUrl = liveDeployment?.deploymentUrl ?? pipelineResult?.deploymentUrl ?? null;
  const effectiveLogs = liveDeployment?.logs ?? pipelineResult?.deploymentLogs ?? null;
  const shouldPoll =
    !!appUuid &&
    !!pipelineResult &&
    !isTerminalStatus(effectiveStatus) &&
    !pipelineRunning;

  useEffect(() => {
    if (!shouldPoll || !appUuid) return;
    let cancelled = false;
    const poll = async () => {
      const progress = await getCoolifyDeploymentProgress(appUuid);
      if (cancelled || !progress.success) return;
      setLiveDeployment({
        status: progress.status,
        deploymentUrl: progress.deploymentUrl ?? null,
        logs: progress.logs ?? null,
        deploymentStepIndex: progress.deploymentStepIndex,
        deploymentStepLabel: progress.deploymentStepLabel,
      });
      if (isTerminalStatus(progress.status)) {
        setPipelineResult((prev) =>
          prev
            ? {
                ...prev,
                deploymentStatus: progress.status,
                deploymentUrl: progress.deploymentUrl ?? prev.deploymentUrl,
                deploymentLogs: progress.logs ?? prev.deploymentLogs,
              }
            : prev
        );
      }
    };
    poll();
    const t = setInterval(poll, DEPLOY_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [shouldPoll, appUuid]);

  if (submitResult) {
    const expectedAppUrl =
      initialData.rootDomain && appSlug
        ? `https://${appSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.${initialData.rootDomain}`
        : null;
    const isDeploySuccess = isTerminalSuccess(effectiveStatus);
    const isDeployBuilding = !!pipelineResult && !isTerminalStatus(effectiveStatus);
    const isDeployFailed = isTerminalFailed(effectiveStatus);
    const appUrl = effectiveUrl
      ? effectiveUrl.startsWith("http")
        ? effectiveUrl
        : `https://${effectiveUrl}`
      : expectedAppUrl;
    const isPolling = shouldPoll;

    return (
      <Card className="main-glass-panel-card">
        <CardHeader>
          <CardTitle>
            {!pipelineResult
              ? "Ready to deploy"
              : isDeploySuccess
                ? "Your app is live"
                : isDeployBuilding
                  ? "Your app is building"
                  : isDeployFailed
                    ? "Deployment had issues"
                    : "Deployment complete"}
          </CardTitle>
          <CardDescription>
            {!pipelineResult
              ? "Your configuration is saved. One click to generate the code, push to GitHub, and deploy to the cloud."
              : isDeploySuccess
                ? "Your application has been built and deployed successfully."
                : isDeployBuilding
                  ? "The app is building. This can take a few minutes. You can open the URL below once it’s ready."
                  : isDeployFailed
                    ? "The build or deploy reported an error. Check the details below or try redeploying."
                    : pipelineResult?.message ?? "Deployment finished."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!pipelineResult ? (
            <>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="font-medium">{appName || "Your app"}</p>
                {expectedAppUrl && (
                  <p className="text-sm text-muted-foreground">
                    Will be available at{" "}
                    <span className="font-mono text-foreground">{expectedAppUrl}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Template: {selectedTemplate?.display_name ?? "—"} · Tenant: {tenants.find((t) => t.id === tenantId)?.name ?? "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  onClick={handleRunPipeline}
                  disabled={pipelineRunning || !credentialsReady}
                >
                  {pipelineRunning ? "Deploying…" : "Deploy now"}
                </Button>
                {pipelineError && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPipelineError(null)}
                    disabled={pipelineRunning}
                  >
                    Dismiss and retry
                  </Button>
                )}
              </div>
              {!credentialsReady && (
                <p className="text-sm text-muted-foreground">Configure credentials above to enable deployment.</p>
              )}
              {pipelineError && <p className="text-sm text-destructive">{pipelineError}</p>}
            </>
          ) : (
            <>
              {/* Multi-step deployment progress (Coolify status + logs → steps) */}
              <div
                className={
                  "rounded-lg border px-4 py-4 " +
                  (isDeploySuccess
                    ? "border-green-500/40 bg-green-500/5 dark:bg-green-500/10"
                    : isDeployFailed
                      ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
                      : "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10")
                }
              >
                {isDeploySuccess && (
                  <div className="flex flex-wrap items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0" />
                    <span className="font-medium text-green-800 dark:text-green-200">Live</span>
                    <span className="text-sm text-muted-foreground">Deployment ready.</span>
                  </div>
                )}
                {isDeployBuilding && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      {DEPLOYMENT_STEPS.map((label, index) => {
                        const currentStep = liveDeployment?.deploymentStepIndex ?? 0;
                        const isDone = index < currentStep;
                        const isCurrent = index === currentStep;
                        return (
                          <div
                            key={label}
                            className="flex items-center gap-1.5 shrink-0"
                          >
                            {index > 0 && (
                              <div
                                className={
                                  "hidden sm:block w-4 sm:w-6 h-0.5 rounded " +
                                  (isDone ? "bg-green-500/60" : "bg-muted")
                                }
                                aria-hidden
                              />
                            )}
                            <div
                              className={
                                "flex items-center gap-1.5 rounded-md px-2 py-1 " +
                                (isCurrent
                                  ? "bg-amber-500/20 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200"
                                  : isDone
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-muted-foreground")
                              }
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                              ) : isCurrent ? (
                                <Loader2Icon className="h-4 w-4 shrink-0 animate-spin text-amber-600 dark:text-amber-500" />
                              ) : (
                                <Circle className="h-4 w-4 shrink-0 opacity-50" />
                              )}
                              <span className="text-sm font-medium">{label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPolling ? (
                        <>
                          <span className="font-medium text-foreground">
                            {liveDeployment?.deploymentStepLabel ?? "Checking…"}
                          </span>
                          {" · "}
                          Checking Coolify every {DEPLOY_POLL_INTERVAL_MS / 1000}s
                        </>
                      ) : (
                        "Deployment started. Steps will update as Coolify reports progress."
                      )}
                    </p>
                  </div>
                )}
                {isDeployFailed && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                      <span className="font-medium text-destructive">Failed</span>
                      <span className="text-sm text-muted-foreground">
                        {liveDeployment?.deploymentStepLabel ?? "Build or deploy reported an error."}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1">
                      {DEPLOYMENT_STEPS.map((label, index) => {
                        const currentStep = liveDeployment?.deploymentStepIndex ?? 0;
                        const isDone = index < currentStep;
                        const isFailedStep = index === currentStep;
                        return (
                          <div key={label} className="flex items-center gap-1.5 shrink-0">
                            {index > 0 && (
                              <div
                                className={
                                  "hidden sm:block w-6 h-0.5 rounded " +
                                  (isDone ? "bg-green-500/40" : "bg-muted")
                                }
                                aria-hidden
                              />
                            )}
                            <div
                              className={
                                "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm " +
                                (isFailedStep
                                  ? "bg-destructive/15 text-destructive font-medium"
                                  : isDone
                                    ? "text-green-600 dark:text-green-500"
                                    : "text-muted-foreground")
                              }
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                              ) : isFailedStep ? (
                                <AlertCircle className="h-4 w-4 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 shrink-0 opacity-50" />
                              )}
                              <span>{label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-muted/20 p-5 space-y-4 main-float">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-lg">{appName || "Your app"}</span>
                  {isDeploySuccess && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                      <CheckCircle2 className="h-3.5 w-3 mr-1" />
                      Live
                    </Badge>
                  )}
                  {isDeployBuilding && (
                    <Badge variant="secondary">
                      <Loader2Icon className="h-3.5 w-3 mr-1 animate-spin" />
                      {liveDeployment?.deploymentStepLabel ?? "Deploying…"}
                    </Badge>
                  )}
                  {isDeployFailed && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3.5 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
                {appUrl && (
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <a href={appUrl} target="_blank" rel="noreferrer">
                        Open app <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                    {pipelineResult.repoUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a href={pipelineResult.repoUrl} target="_blank" rel="noreferrer">
                          View code
                        </a>
                      </Button>
                    )}
                  </div>
                )}
                {!appUrl && pipelineResult.repoUrl && (
                  <Button asChild variant="outline">
                    <a href={pipelineResult.repoUrl} target="_blank" rel="noreferrer">
                      View code <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                )}
              </div>

              <details className="rounded-md border bg-muted/20">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Technical details
                </summary>
                <div className="px-4 pb-4 pt-1 space-y-2 text-sm border-t">
                  <p>
                    <span className="text-muted-foreground">Project ID:</span>{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5">{submitResult.project_id}</code>
                  </p>
                  {pipelineResult.applicationUuid && (
                    <p>
                      <span className="text-muted-foreground">Coolify application:</span>{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5">{pipelineResult.applicationUuid}</code>
                    </p>
                  )}
                  {(effectiveStatus || pipelineResult.message) && (
                    <p className="text-muted-foreground">
                      {pipelineResult.message}
                      {effectiveStatus && !isTerminalSuccess(effectiveStatus) && !isTerminalFailed(effectiveStatus) && (
                        <> · Status: {effectiveStatus}</>
                      )}
                    </p>
                  )}
                  {effectiveLogs && (
                    <div className="mt-2">
                      <p className="text-muted-foreground mb-1">Build logs:</p>
                      <pre className="rounded-md border bg-muted/30 p-3 text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                        {effectiveLogs}
                      </pre>
                    </div>
                  )}
                </div>
              </details>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunPipeline}
                  disabled={pipelineRunning || !credentialsReady}
                >
                  {pipelineRunning ? "Redeploying…" : "Redeploy"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPipelineResult(null);
                    setPipelineError(null);
                  }}
                  disabled={pipelineRunning}
                >
                  Clear result
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/app-factory/projects">View all projects</Link>
                </Button>
              </div>
            </>
          )}
          {!pipelineResult && (
            <Button asChild variant="outline">
              <Link href="/dashboard/app-factory/projects">View projects</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!hasTenants) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No tenant access</CardTitle>
          <CardDescription>
            You must be a member of at least one tenant to launch a project. Contact an admin to be added to a tenant.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!templateId) {
    return (
      <Card className="main-glass-panel-card main-float">
        <CardHeader>
          <CardTitle>Choose a template</CardTitle>
          <CardDescription>
            Select a template to configure and deploy your app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateCards
            templates={initialData.templates}
            onSelect={handleTemplateSelect}
          />
        </CardContent>
      </Card>
    );
  }

  const manifestFormFields = (selectedVersion?.manifest_json as { form_fields?: { key: string; label?: string; type?: string; required?: boolean; default?: string }[] } | undefined)?.form_fields ?? [];

  return (
    <Card className="main-glass-panel-card main-float">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Configure and deploy</CardTitle>
          <CardDescription>
            {selectedTemplate?.display_name} — fill in the details below, then create and deploy.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {versions.length > 1 && (
            <Select
              value={templateVersionId}
              onValueChange={(v) => {
                setTemplateVersionId(v);
                const ver = versions.find((x) => x.id === v);
                const manifest = ver?.manifest_json as { form_fields?: { key: string; default?: string }[] } | undefined;
                const next: Record<string, string> = {};
                manifest?.form_fields?.forEach((f) => {
                  next[f.key] = (manifestFormValues[f.key] ?? (f.default as string)) ?? "";
                });
                setManifestFormValues((prev) => ({ ...next, ...prev }));
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTemplateId("");
              setTemplateVersionId("");
              setSubmitError(null);
            }}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Change template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer (optional)</Label>
              <Select value={customerId ?? "none"} onValueChange={(v) => setCustomerId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Create new customer</Label>
                <Input
                  placeholder="Customer name"
                  value={createCustomerName}
                  onChange={(e) => setCreateCustomerName(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateCustomer} disabled={!createCustomerName.trim() || createCustomerPending}>
                {createCustomerPending ? "Creating…" : "Create"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Tenant (required)</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Apps for this org are grouped in one Coolify project per tenant. A project is created automatically on first deploy.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>App name (required)</Label>
              <Input
                value={appName}
                onChange={(e) => {
                  const name = e.target.value;
                  setAppName(name);
                  if (slugFromName) {
                    const slugified = name
                      .trim()
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                      .replace(/[^a-z0-9-]/g, "")
                      .replace(/-+/g, "-")
                      .replace(/^-|-$/g, "");
                    setAppSlug(slugified);
                  }
                }}
                placeholder="My App"
              />
            </div>
            <div className="space-y-2">
              <Label>App slug (required, a-z 0-9 -)</Label>
              <Input
                value={appSlug}
                onChange={(e) => {
                  setAppSlug(e.target.value);
                  setSlugFromName(false);
                }}
                placeholder="my-app"
              />
              {initialData.rootDomain && appSlug && (
                <p className="text-xs text-muted-foreground font-mono">
                  https://{appSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.{initialData.rootDomain}
                </p>
              )}
            </div>
            {!isCompose && (
              <>
                <div className="space-y-2">
                  <Label>Display name (optional)</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Support email (optional)</Label>
                  <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        {!isCompose && (
          <div className="space-y-4 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">Deployment</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Supabase strategy</Label>
                <Select value={supabaseStrategy} onValueChange={(v) => setSupabaseStrategy(v as typeof supabaseStrategy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared_rls">Shared RLS</SelectItem>
                    <SelectItem value="shared_schema">Shared schema</SelectItem>
                    <SelectItem value="dedicated_project">Dedicated project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Runtime tier</Label>
                <Select value={runtimeTier} onValueChange={(v) => setRuntimeTier(v as typeof runtimeTier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared_multi_tenant">Shared multi-tenant</SelectItem>
                    <SelectItem value="dedicated_app_shared_host">Dedicated app, shared host</SelectItem>
                    <SelectItem value="dedicated_runtime">Dedicated runtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {manifestFormFields.length > 0 && (
          <div className="space-y-4 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">
              {isCompose ? "Environment & config" : "Template options"}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {manifestFormFields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label>
                    {f.label ?? f.key}
                    {f.required ? " (required)" : ""}
                  </Label>
                  <Input
                    type={f.type === "password" ? "password" : "text"}
                    value={manifestFormValues[f.key] ?? ""}
                    onChange={(e) => setManifestFormValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={(f.default as string) ?? ""}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md border bg-muted/50 p-4 text-sm space-y-2">
          <p className="font-medium text-muted-foreground">Summary</p>
          <p><strong>Customer:</strong> {customerId ? customers.find((c) => c.id === customerId)?.name ?? customerId : "None"}</p>
          <p><strong>Tenant:</strong> {tenants.find((t) => t.id === tenantId)?.name ?? tenantId}</p>
          <p><strong>Template:</strong> {selectedTemplate?.display_name} / {selectedVersion?.version ?? templateVersionId}</p>
          <p><strong>App:</strong> {appName || "(empty)"} / {appSlug || "(empty)"}</p>
          {initialData.rootDomain && appSlug && (
            <p><strong>App URL:</strong> https://{appSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.{initialData.rootDomain}</p>
          )}
          {!isCompose && (
            <>
              <p><strong>Supabase:</strong> {supabaseStrategy}</p>
              <p><strong>Runtime:</strong> {runtimeTier}</p>
            </>
          )}
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <div className="flex gap-2">
          <Button
            onClick={handleCreateAndDeploy}
            disabled={submitPending || pipelineRunning || !appName.trim() || !appSlug.trim() || !tenantId || !credentialsReady}
          >
            {(submitPending || pipelineRunning) ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                {submitPending ? "Creating…" : "Deploying…"}
              </>
            ) : (
              "Create and deploy"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit()}
            disabled={submitPending || !appName.trim() || !appSlug.trim() || !tenantId || !credentialsReady}
          >
            {submitPending ? "Saving…" : "Save spec only"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
