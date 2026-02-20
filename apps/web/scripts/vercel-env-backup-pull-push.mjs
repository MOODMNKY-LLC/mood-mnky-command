#!/usr/bin/env node
/**
 * 1. Back up .env, .env.local, and .env.production (if they exist)
 * 2. Pull production env from Vercel into .env.production
 * 3. Compare merged .env + .env.local with Vercel production for vars missing in production
 * 4. Push those missing vars to Vercel production (values from .env / .env.local)
 *
 * Prerequisites: Vercel CLI linked (vercel link). Values are never logged.
 *
 * Usage: node scripts/vercel-env-backup-pull-push.mjs [--dry-run]
 */

import { readFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const DRY_RUN = process.argv.includes("--dry-run");
const root = resolve(process.cwd());

const IGNORE_PREFIXES = ["VERCEL_", "TURBO_", "NX_", "CI_", "GITHUB_", "NODE_"];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      const value = m[2].replace(/^["']|["']$/g, "").trim();
      if (value !== "") vars[m[1]] = value;
    }
  }
  return vars;
}

function shouldIgnore(name) {
  return IGNORE_PREFIXES.some((p) => name.startsWith(p));
}

/** Vars that exist in .env.example (including commented optional ones). Only push these to production. */
function getCanonicalVarNames(path) {
  if (!existsSync(path)) return new Set();
  const content = readFileSync(path, "utf-8");
  const names = new Set();
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (m) names.add(m[1]);
    const commented = line.match(/^#\s*([A-Za-z_][A-Za-z0-9_]*)=/);
    if (commented) names.add(commented[1]);
  }
  return names;
}

// 1. Backup
const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const envPath = resolve(root, ".env");
const envLocalPath = resolve(root, ".env.local");
const envProductionPath = resolve(root, ".env.production");

if (existsSync(envPath)) {
  copyFileSync(envPath, resolve(root, `.env.backup.${ts}`));
  console.log(`Backed up .env`);
}
if (existsSync(envLocalPath)) {
  copyFileSync(envLocalPath, resolve(root, `.env.local.backup.${ts}`));
  console.log(`Backed up .env.local`);
}
if (existsSync(envProductionPath)) {
  copyFileSync(envProductionPath, resolve(root, `.env.production.backup.${ts}`));
  console.log(`Backed up .env.production`);
}

// Merged local = .env + .env.local (not overwritten by pull), .env.local wins
const localMerged = {
  ...parseEnvFile(envPath),
  ...parseEnvFile(envLocalPath),
};

// 2. Pull production to .env.production
console.log("\nPulling production env to .env.production...");
const pull = spawnSync(
  "vercel",
  ["env", "pull", ".env.production", "--environment=production", "--yes"],
  { encoding: "utf-8", cwd: root, shell: process.platform === "win32" }
);
if (pull.status !== 0) {
  console.error("vercel env pull failed:", pull.stderr || pull.stdout || pull.error);
  process.exit(1);
}
console.log("Pull complete.");

// Production keys: use vercel env ls so we don't treat sensitive (redacted) vars as "missing"
function getVercelProductionVarNames() {
  const result = spawnSync("vercel", ["env", "ls", "production"], {
    encoding: "utf-8",
    cwd: root,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error("vercel env ls production failed:", result.stderr || result.stdout);
    process.exit(1);
  }
  const names = new Set();
  const lines = (result.stdout || "" + result.stderr || "").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z][A-Za-z0-9_]*)\s/);
    if (m) names.add(m[1]);
  }
  return names;
}

const productionKeys = getVercelProductionVarNames();
const canonicalNames = getCanonicalVarNames(resolve(root, ".env.example"));

// 3. Compare: in local backup but not in production; only consider vars that are in .env.example
const missing = Object.keys(localMerged).filter(
  (k) =>
    !shouldIgnore(k) &&
    !productionKeys.has(k) &&
    (canonicalNames.size === 0 || canonicalNames.has(k))
);

if (missing.length === 0) {
  console.log("\n✓ No missing variables. Production already has all local vars.");
  process.exit(0);
}

console.log(`\nFound ${missing.length} var(s) in .env/.env.local missing in production: ${missing.join(", ")}`);

if (DRY_RUN) {
  console.log("Dry run — would push the above to Vercel production.");
  process.exit(0);
}

// 4. Push each missing to Vercel production
let added = 0;
let failed = 0;
for (const name of missing) {
  const value = localMerged[name];
  const proc = spawnSync("vercel", ["env", "add", name, "production", "--force"], {
    input: value,
    encoding: "utf-8",
    cwd: root,
    shell: process.platform === "win32",
  });
  if (proc.status === 0) {
    console.log(`  ✓ ${name}`);
    added++;
  } else {
    console.error(`  ✗ ${name}: ${proc.stderr || proc.stdout || "unknown error"}`);
    failed++;
  }
}

console.log(`\nDone: ${added} added to production${failed ? `, ${failed} failed` : ""}.`);
process.exit(failed > 0 ? 1 : 0);
