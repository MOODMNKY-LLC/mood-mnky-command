import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/backoffice-instance";
import { getEnvFromFile } from "@/lib/env-file";

/**
 * GET: Returns whether env-based default Flowise, n8n, MinIO, and Nextcloud are configured,
 * plus base URLs for at-a-glance reference (no keys). Only available to platform_admin.
 */
export async function GET() {
  const allowed = await isPlatformAdmin();
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  const flowiseUrl = getEnvFromFile("FLOWISE_URL");
  const n8nUrl = getEnvFromFile("N8N_URL");
  const minioUrl = getEnvFromFile("MINIO_ENDPOINT") || getEnvFromFile("S3_ENDPOINT_URL");
  const nextcloudUrl = getEnvFromFile("NEXTCLOUD_URL");
  const coolifyHost = getEnvFromFile("COOLIFY_API_HOST");
  const coolifyUrl = getEnvFromFile("COOLIFY_URL") || (coolifyHost ? (coolifyHost.startsWith("http") ? coolifyHost : `https://${coolifyHost}`) : null);
  const flowise = Boolean(flowiseUrl);
  const n8n = Boolean(n8nUrl);
  const minio = Boolean(minioUrl);
  const nextcloud = Boolean(
    nextcloudUrl &&
      getEnvFromFile("NEXTCLOUD_ADMIN_USER") &&
      (getEnvFromFile("NEXTCLOUD_ADMIN_PASSWORD") || getEnvFromFile("NEXTCLOUD_ADMIN_APP_PASSWORD"))
  );
  const coolify = Boolean(coolifyUrl && getEnvFromFile("COOLIFY_API_KEY"));
  return NextResponse.json({
    flowise,
    n8n,
    minio,
    nextcloud,
    coolify,
    flowise_url: flowiseUrl ?? undefined,
    n8n_url: n8nUrl ?? undefined,
    minio_url: minioUrl ?? undefined,
    nextcloud_url: nextcloudUrl ?? undefined,
    coolify_url: coolifyUrl ?? undefined,
  });
}
