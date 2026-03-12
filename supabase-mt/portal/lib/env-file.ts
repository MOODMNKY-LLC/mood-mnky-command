/**
 * Canonical env file for the portal: supabase-mt/.env.local (one level up from portal/).
 * Use this module when reading env from file so credentials work regardless of CWD
 * (e.g. dev run from supabase-mt/portal or supabase-mt).
 *
 * See AGENT-TODO.md and portal/.env.example. Do not read portal/.env.local.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

let _cachedPath: string | null | undefined = undefined;

/**
 * Resolves the path to supabase-mt/.env.local.
 * Tries: PORTAL_ENV_PATH env; then CWD-relative (portal → ../.env.local, supabase-mt → .env.local, else supabase-mt/.env.local from repo root).
 */
export function getPortalEnvFilePath(): string | null {
  if (_cachedPath !== undefined) return _cachedPath ?? null;
  const explicit = process.env.PORTAL_ENV_PATH?.trim();
  if (explicit && existsSync(explicit)) {
    _cachedPath = explicit;
    return explicit;
  }
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "..", ".env.local"),       // CWD = .../portal
    join(cwd, ".env.local"),              // CWD = .../supabase-mt
    join(cwd, "supabase-mt", ".env.local"), // CWD = repo root (mood-mnky-command)
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      _cachedPath = p;
      return p;
    }
  }
  _cachedPath = null;
  return null;
}

/**
 * Read a single env var from process.env or from supabase-mt/.env.local.
 * Use when server-side code may run with different CWD (e.g. API routes, server actions).
 */
export function getEnvFromFile(key: string): string | null {
  const v = process.env[key]?.trim();
  if (v) return v;
  const envPath = getPortalEnvFilePath();
  if (!envPath) return null;
  try {
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
