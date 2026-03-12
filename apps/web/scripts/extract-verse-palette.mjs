#!/usr/bin/env node
/**
 * Extract dominant colors from MNKY VERSE hero images for theme token generation.
 * Outputs CSS custom properties for light/dark themes.
 *
 * Run: pnpm run extract:verse-palette
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { getPalette } = require("colorthief");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const LIGHT_IMG = path.join(root, "public", "verse", "mnky-verse-bg-light.png");
const DARK_IMG = path.join(root, "public", "verse", "mnky-verse-bg-dark.png");

// Fallback if images are in temp
const LIGHT_IMG_FALLBACK = path.join(root, "temp", "mnky-verse-bg-light.png");
const DARK_IMG_FALLBACK = path.join(root, "temp", "mnky-verse-bg-dark.png");

function toHex([r, g, b]) {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function toRgb([r, g, b]) {
  return `${r}, ${g}, ${b}`;
}

async function extractPalette(imgPath, fallbackPath, label) {
  const fs = await import("node:fs");
  const resolved = fs.existsSync(imgPath) ? imgPath : fs.existsSync(fallbackPath) ? fallbackPath : null;
  if (!resolved) {
    console.warn(`[${label}] Image not found at ${imgPath} or ${fallbackPath}`);
    return null;
  }
  try {
    const palette = await getPalette(resolved, 5, 10);
    return palette;
  } catch (e) {
    console.warn(`[${label}] Extraction failed:`, e.message);
    return null;
  }
}

async function main() {
  const [lightPalette, darkPalette] = await Promise.all([
    extractPalette(LIGHT_IMG, LIGHT_IMG_FALLBACK, "light"),
    extractPalette(DARK_IMG, DARK_IMG_FALLBACK, "dark"),
  ]);

  console.log("\n/* Extracted from verse hero images - use or adjust as needed */\n");

  if (lightPalette?.length) {
    const dominant = lightPalette[0];
    const muted = lightPalette[2] ?? lightPalette[1];
    const bg = lightPalette[1] ?? lightPalette[0];
    console.log("/* Light theme (cool gray, subtle undertones) */");
    console.log(".verse-storefront {");
    console.log(`  --verse-bg: ${toHex(bg)};`);
    console.log(`  --verse-bg-rgb: ${toRgb(bg)};`);
    console.log(`  --verse-text: ${toHex(dominant)};`);
    console.log(`  --verse-text-rgb: ${toRgb(dominant)};`);
    console.log(`  --verse-text-muted: ${toHex(muted)};`);
    console.log(`  --verse-border: rgba(${toRgb(dominant)}, 0.08);`);
    console.log(`  --verse-button: ${toHex(muted)};`);
    console.log(`  --verse-button-text: #f8fafc;`);
    console.log("}\n");
  } else {
    console.log("/* Light theme - FALLBACK (extraction failed) */");
    console.log(".verse-storefront {");
    console.log("  --verse-bg: #f1f5f9;");
    console.log("  --verse-bg-rgb: 241, 245, 249;");
    console.log("  --verse-text: #0f172a;");
    console.log("  --verse-text-rgb: 15, 23, 42;");
    console.log("  --verse-text-muted: #64748b;");
    console.log("  --verse-border: rgba(15, 23, 42, 0.08);");
    console.log("  --verse-button: #475569;");
    console.log("  --verse-button-text: #f8fafc;");
    console.log("}\n");
  }

  if (darkPalette?.length) {
    const dominant = darkPalette[0];
    const muted = darkPalette[2] ?? darkPalette[1];
    const bg = darkPalette[1] ?? darkPalette[0];
    console.log("/* Dark theme */");
    console.log('.verse-storefront[data-verse-theme="dark"] {');
    console.log(`  --verse-bg: ${toHex(bg)};`);
    console.log(`  --verse-bg-rgb: ${toRgb(bg)};`);
    console.log(`  --verse-text: ${toHex(dominant)};`);
    console.log(`  --verse-text-rgb: ${toRgb(dominant)};`);
    console.log(`  --verse-text-muted: ${toHex(muted)};`);
    console.log(`  --verse-border: rgba(${toRgb(dominant)}, 0.08);`);
    console.log(`  --verse-button: ${toHex(muted)};`);
    console.log(`  --verse-button-text: #0f172a;`);
    console.log("}\n");
  } else {
    console.log("/* Dark theme - FALLBACK (extraction failed) */");
    console.log('.verse-storefront[data-verse-theme="dark"] {');
    console.log("  --verse-bg: #020617;");
    console.log("  --verse-bg-rgb: 2, 6, 23;");
    console.log("  --verse-text: #f8fafc;");
    console.log("  --verse-text-rgb: 248, 250, 252;");
    console.log("  --verse-text-muted: #94a3b8;");
    console.log("  --verse-border: rgba(248, 250, 252, 0.08);");
    console.log("  --verse-button: #94a3b8;");
    console.log("  --verse-button-text: #0f172a;");
    console.log("}\n");
  }

  console.log("/* Raw palettes for reference: */");
  if (lightPalette) console.log("/* Light:", lightPalette.map(toHex).join(", "), "*/");
  if (darkPalette) console.log("/* Dark:", darkPalette.map(toHex).join(", "), "*/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
