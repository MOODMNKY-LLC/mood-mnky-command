import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { CustomerRow } from "@/lib/app-factory/data";
import { getCustomers, getTenantsForCurrentUser, getTemplatesWithVersions } from "@/lib/app-factory/data";
import { LaunchWizard } from "./launch-wizard";

export const dynamic = "force-dynamic";

/** Read env from process.env or supabase-mt/.env.local (same as backoffice) so credentials show correctly when dev is run from repo root. */
function env(key: string): string | null {
  const v = process.env[key]?.trim();
  if (v) return v;
  try {
    const cwd = process.cwd();
    const envPath = join(cwd, "..", ".env.local");
    if (!existsSync(envPath)) return null;
    const raw = readFileSync(envPath, "utf-8");
    const line = raw.split(/\r?\n/).find((l) => {
      const t = l.trim();
      return t.startsWith(`${key}=`) && !t.startsWith("#");
    });
    if (!line) return null;
    let value = line.slice(line.indexOf("=") + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1).trim();
    return value || null;
  } catch {
    return null;
  }
}

export default async function AppFactoryLaunchPage() {
  const hasGitHub = Boolean(env("GITHUB_TOKEN") || env("GITHUB_ACCESS_TOKEN"));
  const hasCoolify = Boolean(
    env("COOLIFY_API_KEY") && (env("COOLIFY_URL") || env("COOLIFY_API_HOST"))
  );
  const credentialsReady = hasGitHub && hasCoolify;
  const rootDomain = env("APP_FACTORY_ROOT_DOMAIN")?.trim() || null;

  let customers: CustomerRow[] = [];
  let tenants: Awaited<ReturnType<typeof getTenantsForCurrentUser>> = [];
  let templates: Awaited<ReturnType<typeof getTemplatesWithVersions>> = [];
  try {
    [customers, tenants, templates] = await Promise.all([
      getCustomers(),
      getTenantsForCurrentUser(),
      getTemplatesWithVersions(),
    ]);
  } catch (e) {
    console.error("Launch Wizard data load error:", e);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Launch Wizard</h1>
        <p className="text-muted-foreground">
          Guided workflow: select customer or create one, select template, enter app/subdomain and branding,
          choose deployment mode, review spec, launch.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {credentialsReady ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                Credentials configured
              </>
            ) : (
              <>
                <CircleDashed className="h-5 w-5 text-muted-foreground" />
                Configure credentials
              </>
            )}
          </CardTitle>
          <CardDescription>
            Multi-step Launch Wizard will orchestrate: intake → deployment spec (Zod) → generation →
            Git repo → Coolify deploy → health check. Deployment spec schema is in{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">lib/app-factory/deployment-spec.ts</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              {hasGitHub ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0" />
              )}
              <span>GITHUB_TOKEN or GITHUB_ACCESS_TOKEN (repo creation)</span>
            </li>
            <li className="flex items-center gap-2">
              {hasCoolify ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0" />
              )}
              <span>COOLIFY_API_KEY and COOLIFY_URL or COOLIFY_API_HOST (deploy)</span>
            </li>
          </ul>
          {!credentialsReady && (
            <p className="text-sm text-muted-foreground">
              Set the missing variables in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> and
              restart the dev server. See AGENT-TODO.md for the full env matrix.
            </p>
          )}
        </CardContent>
      </Card>

      <LaunchWizard
        credentialsReady={credentialsReady}
        initialData={{ customers, tenants, templates, rootDomain }}
      />
    </div>
  );
}
