/**
 * App Factory: server-side env helper.
 * Uses shared portal env-file so credentials work when dev is run from portal or supabase-mt.
 */

import { existsSync } from "fs";
import { join } from "path";
import { getEnvFromFile } from "@/lib/env-file";

export function getAppFactoryEnv(key: string): string | null {
  return getEnvFromFile(key);
}

export function getGitHubToken(): string | null {
  return getAppFactoryEnv("GITHUB_TOKEN") || getAppFactoryEnv("GITHUB_ACCESS_TOKEN");
}

export function getCoolifyUrl(): string | null {
  const url = getAppFactoryEnv("COOLIFY_URL")?.trim();
  if (url) return url;
  const host = getAppFactoryEnv("COOLIFY_API_HOST")?.trim();
  if (host) return host.startsWith("http") ? host : `https://${host}`;
  return null;
}

export function getCoolifyApiKey(): string | null {
  return getAppFactoryEnv("COOLIFY_API_KEY")?.trim() || null;
}

/** Optional root domain for subdomain derivation (e.g. moodmnky.com → my-app.moodmnky.com). */
export function getAppFactoryRootDomain(): string | null {
  return getAppFactoryEnv("APP_FACTORY_ROOT_DOMAIN")?.trim() || null;
}

/**
 * Default Coolify project name when deployment spec does not set coolify_project_uuid.
 * Generator resolves this name via Coolify API (list projects) and uses that project for deploy.
 * Example: "MOOD MNKY Portal".
 */
export function getAppFactoryCoolifyProjectName(): string | null {
  return getAppFactoryEnv("APP_FACTORY_COOLIFY_PROJECT_NAME")?.trim() || null;
}

/**
 * Base path for template resolution (repo root or supabase-mt). Used with template_registry.source_path.
 */
export function getAppFactoryTemplateBasePath(): string {
  const v = getAppFactoryEnv("APP_FACTORY_TEMPLATE_BASE")?.trim();
  if (v) return v;
  const cwd = process.cwd();
  return join(cwd, "..");
}

/**
 * Resolve a relative source_path (e.g. infra/templates/nextjs/platforms) to an absolute path. Returns null if path does not exist.
 */
export function getResolvedTemplatePath(sourcePath: string): string | null {
  if (!sourcePath?.trim()) return null;
  const base = getAppFactoryTemplateBasePath();
  const absolute = join(base, sourcePath.trim());
  return existsSync(absolute) ? absolute : null;
}

/**
 * Optional path to a local template directory. Prefers infra by framework (infra/templates/nextjs/platforms).
 * If set via env, the generator uses that; otherwise resolves from template_registry.source_path or fallbacks.
 */
export function getAppFactoryTemplatePath(): string | null {
  const v = getAppFactoryEnv("APP_FACTORY_TEMPLATE_PATH")?.trim();
  if (v) return v;
  const fromInfra = getResolvedTemplatePath("infra/templates/nextjs/platforms");
  if (fromInfra) return fromInfra;
  const fromTemp = getResolvedTemplatePath("temp/platforms");
  if (fromTemp) return fromTemp;
  try {
    const cwd = process.cwd();
    const fromPortal = join(cwd, "temp", "platforms");
    if (existsSync(fromPortal)) return fromPortal;
  } catch {
    // ignore
  }
  return null;
}
