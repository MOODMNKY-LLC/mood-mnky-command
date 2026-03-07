"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerRow, TenantRow, TemplateWithVersions } from "@/lib/app-factory/data";
import { createCustomer, submitLaunchSpec, runLaunchPipeline } from "@/lib/app-factory/actions";

const STEPS = [
  { id: 1, title: "Template" },
  { id: 2, title: "Customer & tenant" },
  { id: 3, title: "App & branding" },
  { id: 4, title: "Deployment mode" },
  { id: 5, title: "Review & launch" },
] as const;

export type LaunchWizardInitialData = {
  customers: CustomerRow[];
  tenants: TenantRow[];
  templates: TemplateWithVersions[];
  /** Root domain for URL preview (e.g. moodmnky.com). From APP_FACTORY_ROOT_DOMAIN. */
  rootDomain?: string | null;
};

type Props = {
  credentialsReady: boolean;
  initialData: LaunchWizardInitialData;
};

export function LaunchWizard({ credentialsReady, initialData }: Props) {
  const [step, setStep] = useState(1);
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

  const selectedTemplate = initialData.templates.find((t) => t.id === templateId);
  const versions = selectedTemplate?.versions ?? [];
  const selectedVersion = versions.find((v) => v.id === templateVersionId);

  const canProceed = credentialsReady;
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

  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!tenantId) missing.push("Tenant");
    if (!templateId) missing.push("Template");
    if (!templateVersionId) missing.push("Template version");
    if (!appName.trim()) missing.push("App name");
    if (!appSlug.trim()) missing.push("App slug");
    if (missing.length > 0) {
      setSubmitError(`Missing required: ${missing.join(", ")}. Complete steps 1–4 and fill App name and slug in step 3.`);
      return;
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
    } else {
      setSubmitError(result.error);
    }
  };

  const handleRunPipeline = async () => {
    if (!submitResult) return;
    setPipelineError(null);
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

  if (submitResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Launch submitted</CardTitle>
          <CardDescription>
            Deployment spec saved. Project and spec_generation job created. Run the full pipeline to generate code, push to GitHub, and deploy via Coolify.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Project ID: <code className="rounded bg-muted px-1">{submitResult.project_id}</code>
          </p>
          {!pipelineResult ? (
            <>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  onClick={handleRunPipeline}
                  disabled={pipelineRunning || !credentialsReady}
                >
                  {pipelineRunning ? "Running pipeline…" : "Run pipeline (generate → GitHub → Coolify)"}
                </Button>
                {pipelineError && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setPipelineError(null); }}
                    disabled={pipelineRunning}
                  >
                    Reset and retry
                  </Button>
                )}
              </div>
              {!credentialsReady && (
                <p className="text-sm text-muted-foreground">Configure credentials above to run the pipeline.</p>
              )}
              {pipelineError && <p className="text-sm text-destructive mt-2">{pipelineError}</p>}
            </>
          ) : (
            <div className="space-y-2 text-sm">
              {pipelineResult.deploymentStatus && (
                <p>
                  <strong>Build:</strong>{" "}
                  <span
                    className={
                      ["success", "succeeded", "finished"].includes(pipelineResult.deploymentStatus.toLowerCase())
                        ? "text-green-600 dark:text-green-500"
                        : pipelineResult.deploymentStatus.toLowerCase() === "timeout"
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-amber-600 dark:text-amber-500"
                    }
                  >
                    {pipelineResult.deploymentStatus === "timeout"
                      ? "Still building (check Coolify)"
                      : pipelineResult.deploymentStatus}
                  </span>
                  {pipelineResult.deploymentStatus.toLowerCase() === "timeout" && (
                    <span className="block text-muted-foreground text-xs mt-1">
                      The app was created; build may still be in progress. Open Coolify or the App URL below to verify.
                    </span>
                  )}
                </p>
              )}
              {pipelineResult.deploymentUrl && (
                <p>
                  <strong>App URL:</strong>{" "}
                  <a
                    href={
                      pipelineResult.deploymentUrl.startsWith("http")
                        ? pipelineResult.deploymentUrl
                        : `https://${pipelineResult.deploymentUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {pipelineResult.deploymentUrl}
                  </a>
                </p>
              )}
              {pipelineResult.repoUrl && (
                <p>
                  Repo: <a href={pipelineResult.repoUrl} target="_blank" rel="noreferrer" className="text-primary underline">{pipelineResult.repoUrl}</a>
                </p>
              )}
              {pipelineResult.applicationUuid && <p className="text-muted-foreground">Coolify application: {pipelineResult.applicationUuid}</p>}
              {pipelineResult.message && <p className="text-muted-foreground">{pipelineResult.message}</p>}
              {pipelineResult.deploymentLogs && (
                <details className="rounded-md border bg-muted/30 mt-2">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                    Build / deploy logs
                  </summary>
                  <pre className="p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words border-t">
                    {pipelineResult.deploymentLogs}
                  </pre>
                </details>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleRunPipeline} disabled={pipelineRunning || !credentialsReady}>
                  {pipelineRunning ? "Running…" : "Run pipeline again (overwrite repo)"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setPipelineResult(null); setPipelineError(null); }}
                  disabled={pipelineRunning}
                >
                  Wipe result
                </Button>
              </div>
            </div>
          )}
          <Button asChild variant="outline" className="mt-2">
            <Link href={`/dashboard/app-factory/projects`}>View projects</Link>
          </Button>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wizard</CardTitle>
        <CardDescription>
          Step {step} of 5: {STEPS[step - 1].title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2 flex-wrap">
          {STEPS.map((s) => (
            <Button
              key={s.id}
              variant={step === s.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStep(s.id)}
              disabled={!canProceed}
            >
              {s.id}. {s.title}
            </Button>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template (required)</Label>
              <Select
                value={templateId}
                onValueChange={(v) => {
                  setTemplateId(v);
                  const t = initialData.templates.find((x) => x.id === v);
                  const vers = t?.versions ?? [];
                  setTemplateVersionId(vers.length === 1 ? vers[0].id : "");
                  const manifest = (vers[0] ?? vers.find(() => true))?.manifest_json as { form_fields?: { key: string; label?: string; type?: string; default?: string }[] } | undefined;
                  const next: Record<string, string> = {};
                  manifest?.form_fields?.forEach((f) => {
                    next[f.key] = (f.default as string) ?? "";
                  });
                  setManifestFormValues(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {initialData.templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.display_name} ({t.template_key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {versions.length > 0 ? (
              <div className="space-y-2">
                <Label>Version (required)</Label>
                <Select
                  value={templateVersionId}
                  onValueChange={(v) => {
                    setTemplateVersionId(v);
                    const ver = versions.find((x) => x.id === v);
                    const manifest = ver?.manifest_json as { form_fields?: { key: string; label?: string; type?: string; default?: string }[] } | undefined;
                    const next: Record<string, string> = {};
                    manifest?.form_fields?.forEach((f) => {
                      next[f.key] = (manifestFormValues[f.key] ?? (f.default as string)) ?? "";
                    });
                    setManifestFormValues((prev) => ({ ...next, ...prev }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              selectedTemplate && (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  No versions for this template. Add a version in Templates or choose another template.
                </p>
              )
            )}
          </div>
        )}

        {step === 2 && (
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
            </div>
          </div>
        )}

        {step === 3 && (
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
              <p className="text-xs text-muted-foreground">
                Used as subdomain. App URL will be https://&lt;slug&gt;.{initialData.rootDomain ?? "moodmnky.com"}.
              </p>
            </div>
            {initialData.rootDomain && (
              <div className="space-y-2">
                <Label>App URL</Label>
                <p className="text-sm font-mono rounded-md bg-muted px-3 py-2">
                  https://{appSlug ? `${appSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.${initialData.rootDomain}` : "…"}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Display name (optional)</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Support email (optional)</Label>
              <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            {(selectedVersion?.manifest_json as { form_fields?: { key: string; label?: string; type?: string; required?: boolean; default?: string }[] } | undefined)?.form_fields?.length ? (
              <div className="space-y-4 pt-2 border-t">
                <p className="text-sm font-medium text-muted-foreground">Template options</p>
                {((selectedVersion?.manifest_json as { form_fields: { key: string; label?: string; type?: string; required?: boolean; default?: string }[] }).form_fields).map((f) => (
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
            ) : null}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
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
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/50 p-4 text-sm space-y-2">
              <p><strong>Customer:</strong> {customerId ? customers.find((c) => c.id === customerId)?.name ?? customerId : "None"}</p>
              <p><strong>Tenant:</strong> {tenants.find((t) => t.id === tenantId)?.name ?? tenantId}</p>
              <p><strong>Template:</strong> {selectedTemplate?.display_name ?? templateId} / {selectedVersion?.version ?? templateVersionId}</p>
              <p><strong>App:</strong> {appName || "(empty)"} / {appSlug || "(empty)"}</p>
              <p><strong>App URL:</strong> {initialData.rootDomain && appSlug ? `https://${appSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.${initialData.rootDomain}` : "—"}</p>
              <p><strong>Supabase:</strong> {supabaseStrategy}</p>
              <p><strong>Runtime:</strong> {runtimeTier}</p>
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button onClick={handleSubmit} disabled={submitPending || !appName.trim() || !appSlug.trim()}>
              {submitPending ? "Submitting…" : "Launch (save spec)"}
            </Button>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 5 && (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed}>
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
