#!/usr/bin/env node
/**
 * Fetches the ngrok tunnel URL and updates NEXT_PUBLIC_APP_URL in .env.local.
 *
 * Sources (in order):
 * 1. ngrok local API (http://127.0.0.1:4040/api/tunnels) when ngrok is running
 * 2. NGROK_DOMAIN in .env.local → https://${NGROK_DOMAIN}.ngrok-free.app
 *
 * Usage:
 *   pnpm ngrok:sync-url
 *
 * Prerequisites:
 *   - For (1): Run `pnpm dev:tunnel` (or `ngrok http 3000`) in another terminal first
 *   - For (2): Add NGROK_DOMAIN=your-domain to .env.local (claim at dashboard.ngrok.com)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const envPath = resolve(root, ".env.local");

async function fetchFromNgrokApi() {
  try {
    const res = await fetch("http://127.0.0.1:4040/api/tunnels");
    if (!res.ok) return null;
    const data = await res.json();
    const tunnel = data.tunnels?.find((t) => t.public_url?.startsWith("https://"));
    return tunnel?.public_url ?? null;
  } catch {
    return null;
  }
}

function getUrlFromDomain(domain) {
  const d = domain.trim().replace(/^["']|["']$/g, "");
  if (!d) return null;
  // Full domain (e.g. unupbraiding-unilobed-eustolia.ngrok-free.dev)
  if (d.includes(".ngrok-free.")) {
    return d.startsWith("http") ? d : `https://${d}`;
  }
  // Subdomain only (e.g. mood-mnky-dev) → .ngrok-free.app
  return `https://${d}.ngrok-free.app`;
}

function updateEnvLocal(url) {
  if (!existsSync(envPath)) {
    console.error(".env.local not found");
    process.exit(1);
  }
  let content = readFileSync(envPath, "utf-8");
  const regex = /^NEXT_PUBLIC_APP_URL=.*$/m;
  const line = `NEXT_PUBLIC_APP_URL=${url}`;
  if (regex.test(content)) {
    content = content.replace(regex, line);
  } else {
    content += `\n${line}\n`;
  }
  writeFileSync(envPath, content);
  console.log(`Updated NEXT_PUBLIC_APP_URL=${url}`);
}

async function main() {
  // 1. Try ngrok local API (when tunnel is running)
  const apiUrl = await fetchFromNgrokApi();
  if (apiUrl) {
    updateEnvLocal(apiUrl);
    console.log("(from ngrok local API at 127.0.0.1:4040)");
    return;
  }

  // 2. Try NGROK_DOMAIN from .env.local
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const m = content.match(/NGROK_DOMAIN=(.+)/);
    if (m) {
      const domain = m[1].trim().replace(/^["']|["']$/g, "");
      const url = getUrlFromDomain(domain);
      if (url) {
        updateEnvLocal(url);
        console.log("(from NGROK_DOMAIN in .env.local)");
        return;
      }
    }
  }

  console.error("Could not determine ngrok URL.");
  console.error("");
  console.error("Options:");
  console.error("  1. Start ngrok first: pnpm dev:tunnel (or ngrok http 3000), then run this again.");
  console.error("  2. Add NGROK_DOMAIN=your-domain to .env.local (claim at dashboard.ngrok.com/cloud-edge/domains).");
  process.exit(1);
}

main();
