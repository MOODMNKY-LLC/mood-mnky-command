#!/usr/bin/env node
/**
 * Copy overlay source from resources/ffxiv/overlays/ to apps/hydaelyn/public/overlays/
 * when that app exists. Run from repo root: node tools/ffxiv/copy-overlays.mjs
 * If the destination app is not present, exits 0 without copying.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const sourceDir = join(repoRoot, "resources", "ffxiv", "overlays");
const destDir = join(repoRoot, "apps", "hydaelyn", "public", "overlays");

function copyRecursive(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      cpSync(srcPath, destPath, { force: true });
    }
  }
}

try {
  if (!existsSync(join(repoRoot, "apps", "hydaelyn"))) {
    process.exit(0);
  }
  if (!statSync(sourceDir).isDirectory()) {
    console.warn("Source directory does not exist:", sourceDir);
    process.exit(0);
  }
  mkdirSync(destDir, { recursive: true });
  copyRecursive(sourceDir, destDir);
  console.log("Overlays copied to", destDir);
} catch (err) {
  console.error(err);
  process.exit(1);
}
