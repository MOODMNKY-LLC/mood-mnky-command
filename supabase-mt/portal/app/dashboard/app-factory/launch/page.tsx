import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import type { CustomerRow } from "@/lib/app-factory/data";
import { getAppFactoryConnectivity } from "@/lib/app-factory/connectivity";
import { getCustomers, getTenantsForCurrentUser, getTemplatesWithVersions } from "@/lib/app-factory/data";
import { AppGenerator } from "./app-generator";

export const dynamic = "force-dynamic";

/** Read env from process.env or supabase-mt/.env.local (same as backoffice). */
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
  const connectivity = await getAppFactoryConnectivity();
  const credentialsReady = connectivity.github.ok && connectivity.coolify.ok;
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
    console.error("App Generator data load error:", e);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">App Generator</h1>
        <p className="text-muted-foreground">
          Choose a template, fill in the intake form, then create and deploy. The generator creates the app, pushes to GitHub, and deploys to Coolify.
        </p>
      </div>

      <Card className="main-glass-panel-card main-float">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {credentialsReady ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                App generator ready
              </>
            ) : (
              <>
                <CircleDashed className="h-5 w-5 text-muted-foreground" />
                App generator not ready
              </>
            )}
          </CardTitle>
          <CardDescription>
            The app generator can create and deploy apps. Integrations use healthchecks to verify connectivity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              {connectivity.github.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0" />
              )}
              <span>GitHub integration: {connectivity.github.ok ? "connected" : "disconnected"}</span>
            </li>
            <li className="flex items-center gap-2">
              {connectivity.coolify.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
              ) : (
                <CircleDashed className="h-4 w-4 shrink-0" />
              )}
              <span>Coolify server: {connectivity.coolify.ok ? "connected" : "disconnected"}</span>
            </li>
          </ul>
          {!credentialsReady && (
            <p className="text-sm text-muted-foreground">
              Configure credentials in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> and
              restart the dev server. See AGENT-TODO or backoffice docs for the env matrix.
            </p>
          )}
        </CardContent>
      </Card>

      <AppGenerator
        credentialsReady={credentialsReady}
        initialData={{ customers, tenants, templates, rootDomain }}
      />
    </div>
  );
}
