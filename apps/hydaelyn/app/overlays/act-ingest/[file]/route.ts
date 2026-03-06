import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ALLOWED_FILES = ["index.html", "script.js"] as const;
const CONTENT_TYPES: Record<(typeof ALLOWED_FILES)[number], string> = {
  "index.html": "text/html; charset=utf-8",
  "script.js": "application/javascript; charset=utf-8",
};

/** Public overlay dir: app/overlays/act-ingest/[file] -> up to app root, then public/overlays/act-ingest */
const PUBLIC_OVERLAY_DIR = join(__dirname, "..", "..", "..", "..", "public", "overlays", "act-ingest");

/**
 * Serve overlay static assets so /overlays/act-ingest/index.html and
 * script.js are always reachable (avoids 404 when App Router takes precedence).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  if (!file || !ALLOWED_FILES.includes(file as (typeof ALLOWED_FILES)[number])) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const path = join(PUBLIC_OVERLAY_DIR, file);
    const body = await readFile(path, "utf-8");
    const contentType = CONTENT_TYPES[file as (typeof ALLOWED_FILES)[number]];
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
