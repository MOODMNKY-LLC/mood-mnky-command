#!/usr/bin/env node
/**
 * Starts ngrok tunnel for local Customer Account API development.
 * Requires: ngrok installed, auth token configured, NGROK_DOMAIN in .env.local (optional).
 *
 * Usage:
 *   pnpm dev:tunnel
 *   pnpm dev:tunnel -- 3000   # custom port
 *
 * If NGROK_DOMAIN is set (e.g. mood-mnky-dev), uses: ngrok http --domain=NGROK_DOMAIN.ngrok-free.app 3000
 * Otherwise: ngrok http 3000 (random URL – you'll need to add it to Hydrogen each time)
 */

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const envPath = resolve(root, ".env.local");
const port = process.argv[2] || "3000";

let domain = null;
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  const m = content.match(/NGROK_DOMAIN=(.+)/);
  if (m) {
    domain = m[1].trim().replace(/^["']|["']$/g, "");
  }
}

// Full domain (e.g. unupbraiding-unilobed-eustolia.ngrok-free.dev) or subdomain (e.g. mood-mnky-dev)
const domainArg = domain?.includes(".ngrok-free.")
  ? domain
  : domain
    ? `${domain}.ngrok-free.app`
    : null;

const args = domainArg ? ["http", "--domain", domainArg, port] : ["http", port];

if (!domainArg) {
  console.warn(
    "⚠ No NGROK_DOMAIN in .env.local – using random URL (changes each restart).\n" +
      "   Add NGROK_DOMAIN=your-domain.ngrok-free.dev (or subdomain for .ngrok-free.app) for a stable URL.\n"
  );
}

console.log(`Starting ngrok tunnel to localhost:${port}...`);
if (domainArg) {
  const url = domainArg.startsWith("http") ? domainArg : `https://${domainArg}`;
  const base = url.replace(/^https?:\/\//, "");
  console.log(`  Domain: https://${base}`);
  console.log(`  Callback: https://${base}/api/customer-account-api/callback`);
}

const proc = spawn("npx", ["ngrok", ...args], {
  stdio: "inherit",
  shell: true,
});

proc.on("error", (err) => {
  console.error("Failed to start ngrok:", err.message);
  console.error("\nInstall ngrok: https://ngrok.com/download");
  console.error("Add auth token: ngrok config add-authtoken <token>");
  process.exit(1);
});

proc.on("exit", (code) => {
  process.exit(code ?? 0);
});
