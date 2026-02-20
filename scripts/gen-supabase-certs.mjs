#!/usr/bin/env node
/**
 * Generate locally-trusted TLS certs for Supabase using mkcert.
 * Fixes "self-signed certificate" / "fetch failed" on login.
 *
 * Prerequisites:
 *   mkcert -install  (run once after installing mkcert)
 *
 * Usage: pnpm supabase:tls-setup
 */

import { execSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const certsDir = join(__dirname, "..", "certs");
const certFile = join(certsDir, "supabase-cert.pem");
const keyFile = join(certsDir, "supabase-key.pem");

try {
  execSync("mkcert -version", { stdio: "ignore" });
} catch {
  console.error("mkcert not found. Install it first:");
  console.error("  Windows: winget install mkcert");
  console.error("  macOS:   brew install mkcert");
  console.error("  Then:    mkcert -install");
  process.exit(1);
}

mkdirSync(certsDir, { recursive: true });

console.log("Generating locally-trusted certs for 127.0.0.1, localhost...");
execSync(`mkcert -cert-file "${certFile}" -key-file "${keyFile}" 127.0.0.1 localhost`, {
  stdio: "inherit",
});

console.log("\nDone. Restart Supabase: supabase stop && supabase start");
if (!existsSync(certFile)) {
  process.exit(1);
}
