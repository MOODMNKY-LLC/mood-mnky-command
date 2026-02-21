/**
 * Push env vars that exist in .env / .env.local but are missing from Vercel production.
 * Run from repo root: node scripts/push-missing-vercel-env.mjs
 * Requires: vercel CLI logged in.
 */
import { readFileSync, existsSync } from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const text = readFileSync(filePath, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/\\"/g, '"');
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1).replace(/\\'/g, "'");
    out[key] = val;
  }
  return out;
}

function keysFromEnvFile(filePath) {
  const parsed = parseEnvFile(filePath);
  return new Set(Object.keys(parsed));
}

async function runVercelEnvAdd(key, value) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "pnpm",
      ["exec", "vercel", "env", "add", key, "production", "--yes", "--force"],
      { cwd: root, stdio: ["pipe", "inherit", "inherit"], shell: true }
    );
    proc.on("error", reject);
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    proc.stdin.write(value, "utf8", () => {
      proc.stdin.end();
    });
  });
}

const productionKeys = keysFromEnvFile(path.join(root, ".env.production"));
const envLocal = parseEnvFile(path.join(root, ".env.local"));
const env = parseEnvFile(path.join(root, ".env"));

// Vars we want on Vercel production if missing (and we have a value in .env or .env.local)
const wanted = [
  "PUBLIC_CUSTOMER_ACCOUNT_API_LOGOUT_URL",
  "SESSION_SECRET",
  "STORAGE_TYPE",
  "BLOB_STORAGE_PATH",
  "S3_STORAGE_BUCKET_NAME",
  "S3_STORAGE_ACCESS_KEY_ID",
  "S3_STORAGE_SECRET_ACCESS_KEY",
  "S3_STORAGE_REGION",
  "S3_ENDPOINT_URL",
  "S3_FORCE_PATH_STYLE",
];

const missing = wanted.filter((k) => !productionKeys.has(k));
const withValues = missing
  .map((k) => {
    const v = envLocal[k] ?? env[k];
    return v != null && v !== "" ? [k, v] : null;
  })
  .filter(Boolean);

if (withValues.length === 0) {
  console.log("No missing production vars to push (or no values in .env/.env.local).");
  process.exit(0);
}

console.log("Pushing to Vercel production:", withValues.map(([k]) => k).join(", "));
for (const [key, value] of withValues) {
  try {
    await runVercelEnvAdd(key, value);
    console.log("OK:", key);
  } catch (e) {
    console.error("Failed:", key, e.message);
    process.exit(1);
  }
}
console.log("Done.");
