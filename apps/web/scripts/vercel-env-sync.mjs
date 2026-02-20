#!/usr/bin/env node
/**
 * Syncs env vars from .env and .env.local to Vercel production.
 * Adds only vars that (a) exist in .env.example, (b) have non-empty values locally, and
 * (c) are missing in production. Ignores system/tooling vars (VERCEL_*, TURBO_*, NX_*, etc.).
 *
 * Prerequisites: Vercel CLI linked (vercel link). Run locally; values are never logged.
 *
 * Usage: node scripts/vercel-env-sync.mjs [--dry-run]
 */

import { readFileSync, existsSync } from "node:fs";
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

function getCanonicalVarNames(path) {
  if (!existsSync(path)) return new Set();
  const content = readFileSync(path, "utf-8");
  const names = new Set();
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (m && !line.trim().startsWith("#")) names.add(m[1]);
  }
  return names;
}

function shouldIgnore(name) {
  return IGNORE_PREFIXES.some((p) => name.startsWith(p));
}

function getVercelProductionVars() {
  const result = spawnSync("vercel", ["env", "ls", "production"], {
    encoding: "utf-8",
    cwd: root,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error("vercel env ls production failed:", result.stderr || result.stdout || result.error);
    process.exit(1);
  }
  const names = new Set();
  const output = (result.stdout || "") + (result.stderr || "");
  const lines = output.split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]+)\s/);
    if (m) names.add(m[1]);
  }
  return names;
}

const envPath = resolve(root, ".env");
const envLocalPath = resolve(root, ".env.local");
const examplePath = resolve(root, ".env.example");

const canonicalNames = getCanonicalVarNames(examplePath);
const localVars = { ...parseEnvFile(envPath), ...parseEnvFile(envLocalPath) };

const toConsider = {};
for (const [k, v] of Object.entries(localVars)) {
  if (!shouldIgnore(k) && (canonicalNames.size === 0 || canonicalNames.has(k))) toConsider[k] = v;
}

if (Object.keys(toConsider).length === 0) {
  console.warn("⚠ No vars found in .env/.env.local that match .env.example. Nothing to sync.");
  process.exit(0);
}

const vercelNames = getVercelProductionVars();
const missing = Object.keys(toConsider).filter((k) => !vercelNames.has(k));

if (missing.length === 0) {
  console.log("✓ All local env vars already present in Vercel production.");
  process.exit(0);
}

console.log(`Found ${missing.length} var(s) to add: ${missing.join(", ")}`);

if (DRY_RUN) {
  console.log("Dry run — would add:", missing);
  process.exit(0);
}

let added = 0;
let failed = 0;

for (const name of missing) {
  const value = toConsider[name];
  const proc = spawnSync("vercel", ["env", "add", name, "production"], {
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

console.log(`\nDone: ${added} added${failed ? `, ${failed} failed` : ""}.`);
process.exit(failed > 0 ? 1 : 0);
