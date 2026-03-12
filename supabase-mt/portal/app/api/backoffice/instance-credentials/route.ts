import { NextResponse } from "next/server";
import {
  resolveInstance,
  getNextcloudPassword,
} from "@/lib/backoffice-proxy";
import { canAccessInstance } from "@/lib/backoffice-instance";
import { getMinioCredentials } from "@/lib/backoffice-minio";

/**
 * GET: Returns base_url and credential (API key / access key) for the given instance.
 * Only for platform_admin or tenant admin of that instance. Used for "reveal on click" in admin UI.
 * MinIO: returns endpoint and access_key only (secret never exposed).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const instanceId = url.searchParams.get("instanceId");
  if (!instanceId) {
    return NextResponse.json({ message: "instanceId required." }, { status: 400 });
  }

  const instance = await resolveInstance(request);
  if (!instance) {
    return NextResponse.json({ message: "Instance not found." }, { status: 400 });
  }
  const allowed = await canAccessInstance(instance);
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const baseUrl = (instance.base_url ?? "").trim() || null;
  if (instance.app_type === "minio") {
    const creds = getMinioCredentials(instance);
    return NextResponse.json({
      base_url: baseUrl,
      endpoint: baseUrl,
      access_key: creds?.accessKey ?? null,
      secret_key: creds?.secretKey ?? null,
    });
  }

  if (instance.app_type === "nextcloud") {
    const password = getNextcloudPassword(instance);
    return NextResponse.json({
      base_url: baseUrl,
      username: (instance.api_key_encrypted ?? "").trim() || null,
      password,
    });
  }

  if (instance.app_type === "coolify") {
    return NextResponse.json({
      base_url: baseUrl,
      api_key: (instance.api_key_encrypted ?? "").trim() || null,
    });
  }

  return NextResponse.json({
    base_url: baseUrl,
    api_key: (instance.api_key_encrypted ?? "").trim() || null,
  });
}
