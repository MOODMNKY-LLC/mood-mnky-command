import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { isPlatformAdmin } from "@/lib/backoffice-instance";

/** Read env from supabase-mt/.env.local when process.env doesn't have it (e.g. dev run from repo root). */
function env(key: string): string | null {
  const v = process.env[key]?.trim();
  if (v) return v;
  try {
    const cwd = process.cwd();
    const envPath = join(cwd, "..", ".env.local");
    if (!existsSync(envPath)) return null;
    const raw = readFileSync(envPath, "utf-8");
    const line = raw.split(/\r?\n/).find((l) => {
      const t = l.trim();
      return t.startsWith(`${key}=`) && !t.startsWith("#");
    });
    if (!line) return null;
    let value = line.slice(line.indexOf("=") + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1).trim();
    return value || null;
  } catch {
    return null;
  }
}

/**
 * GET: Returns whether env-based default Flowise, n8n, MinIO, and Nextcloud are configured,
 * plus base URLs for at-a-glance reference (no keys). Only available to platform_admin.
 */
export async function GET() {
  const allowed = await isPlatformAdmin();
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  const flowiseUrl = env("FLOWISE_URL");
  const n8nUrl = env("N8N_URL");
  const minioUrl = env("MINIO_ENDPOINT") || env("S3_ENDPOINT_URL");
  const nextcloudUrl = env("NEXTCLOUD_URL");
  const flowise = Boolean(flowiseUrl);
  const n8n = Boolean(n8nUrl);
  const minio = Boolean(minioUrl);
  const nextcloud = Boolean(
    nextcloudUrl &&
      env("NEXTCLOUD_ADMIN_USER") &&
      (env("NEXTCLOUD_ADMIN_PASSWORD") || env("NEXTCLOUD_ADMIN_APP_PASSWORD"))
  );
  return NextResponse.json({
    flowise,
    n8n,
    minio,
    nextcloud,
    flowise_url: flowiseUrl ?? undefined,
    n8n_url: n8nUrl ?? undefined,
    minio_url: minioUrl ?? undefined,
    nextcloud_url: nextcloudUrl ?? undefined,
  });
}
