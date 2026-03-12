/**
 * Fetch Coolify application logs using COOLIFY_URL and COOLIFY_API_KEY from supabase-mt/.env.local.
 * Usage: node scripts/coolify-logs.mjs [application-uuid] [lines] [--out file.txt]
 *         node scripts/coolify-logs.mjs --list
 *   If uuid is omitted, lists applications and fetches logs for the first one.
 *   --list: only list application names and UUIDs (no logs).
 *   lines defaults to 300. Optional --out writes logs to a file.
 *
 * Run from portal: node scripts/coolify-logs.mjs
 * Or from supabase-mt: node portal/scripts/coolify-logs.mjs
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "..", "..", ".env.local");
  if (!existsSync(envPath)) {
    console.error("Missing .env.local at supabase-mt/.env.local");
    process.exit(1);
  }
  const raw = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1).trim();
    env[key] = value;
  }
  return env;
}

async function coolifyFetch(baseUrl, token, path) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
}

async function main() {
  const env = loadEnv();
  const url = env.COOLIFY_URL?.trim() || (env.COOLIFY_API_HOST ? `https://${env.COOLIFY_API_HOST}` : null);
  const token = env.COOLIFY_API_KEY?.trim();
  if (!url || !token) {
    console.error("Set COOLIFY_URL (or COOLIFY_API_HOST) and COOLIFY_API_KEY in supabase-mt/.env.local");
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((a) => a !== "--out" && a !== "--list" && !a.startsWith("--out="));
  const outIdx = process.argv.indexOf("--out");
  const outFile = outIdx >= 0 && process.argv[outIdx + 1] ? process.argv[outIdx + 1] : null;
  const listOnly = process.argv.includes("--list");
  const uuidArg = args[0];
  const linesArg = args[1];
  const lines = linesArg ? parseInt(linesArg, 10) : 300;
  const effectiveLines = Number.isFinite(lines) && lines >= 1 ? Math.min(2000, lines) : 300;

  const listRes = await coolifyFetch(url, token, "/applications");
  if (!listRes.ok) {
    console.error("Failed to list applications:", listRes.status, await listRes.text());
    process.exit(1);
  }
  const list = await listRes.json();
  const apps = Array.isArray(list) ? list : [];

  if (listOnly) {
    if (apps.length === 0) {
      console.log("No applications found in Coolify.");
    } else {
      for (const a of apps) {
        console.log(`${a.name ?? "unnamed"}\t${a.uuid ?? a.id ?? ""}`);
      }
    }
    return;
  }

  let applicationUuid = uuidArg?.trim() || null;
  if (!applicationUuid) {
    if (apps.length === 0) {
      console.error("No applications found in Coolify.");
      process.exit(1);
    }
    applicationUuid = apps[0].uuid ?? apps[0].id;
    const name = apps[0].name ?? "unknown";
    console.error(`Using first application: ${name} (${applicationUuid})\n`);
  }

  const logRes = await coolifyFetch(
    url,
    token,
    `/applications/${encodeURIComponent(applicationUuid)}/logs?lines=${effectiveLines}`
  );
  const logBodyText = await logRes.text();
  if (!logRes.ok) {
    console.error("Failed to fetch logs:", logRes.status, logBodyText);
    process.exit(1);
  }
  let logText;
  try {
    const body = JSON.parse(logBodyText);
    logText = typeof body?.logs === "string" ? body.logs : logBodyText;
  } catch {
    logText = logBodyText;
  }
  if (outFile) {
    writeFileSync(outFile, logText, "utf-8");
    console.error("Logs written to", outFile);
  } else {
    console.log(logText);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
