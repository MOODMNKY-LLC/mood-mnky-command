import { NextResponse } from "next/server";
import {
  getInstanceById,
  getInstanceByTenantAndApp,
  getEnvDefaultInstance,
  ENV_INSTANCE_IDS,
  canAccessInstance,
  type AppInstance,
} from "./backoffice-instance";
import { getEnvFromFile } from "@/lib/env-file";

export type ResolveInstanceParams =
  | { instanceId: string }
  | { tenantId: string; appType: string; name?: string | null };

/**
 * Resolve instance from query params only (so request body is left intact for forwarding).
 * Supports instanceId (including env-flowise / env-n8n) or tenantId+appType+name with env fallback.
 */
export async function resolveInstance(
  request: Request
): Promise<AppInstance | null> {
  const url = new URL(request.url);
  const instanceId = url.searchParams.get("instanceId");
  const tenantId = url.searchParams.get("tenantId");
  const appTypeParam = url.searchParams.get("appType");
  const name = url.searchParams.get("name") ?? undefined;
  const appType =
    appTypeParam === "flowise" || appTypeParam === "n8n" || appTypeParam === "minio" || appTypeParam === "nextcloud" || appTypeParam === "coolify"
      ? appTypeParam
      : null;

  if (instanceId) {
    if (
      instanceId === ENV_INSTANCE_IDS.flowise ||
      instanceId === ENV_INSTANCE_IDS.n8n ||
      instanceId === ENV_INSTANCE_IDS.minio ||
      instanceId === ENV_INSTANCE_IDS.nextcloud ||
      instanceId === ENV_INSTANCE_IDS.coolify
    ) {
      const envAppType =
        instanceId === ENV_INSTANCE_IDS.flowise
          ? "flowise"
          : instanceId === ENV_INSTANCE_IDS.n8n
            ? "n8n"
            : instanceId === ENV_INSTANCE_IDS.minio
              ? "minio"
              : instanceId === ENV_INSTANCE_IDS.coolify
                ? "coolify"
                : "nextcloud";
      return getEnvDefaultInstance(envAppType);
    }
    const fromDb = await getInstanceById(instanceId);
    if (fromDb) return fromDb;
    return null;
  }
  if (tenantId && appType) {
    const fromDb = await getInstanceByTenantAndApp(tenantId, appType, name || undefined);
    if (fromDb) return fromDb;
    return getEnvDefaultInstance(appType);
  }
  return null;
}

/**
 * Forward request to Flowise: base_url + /api/v1 + pathSegments, Authorization: Bearer api_key.
 */
export async function forwardToFlowise(
  instance: AppInstance,
  pathSegments: string[],
  request: Request
): Promise<NextResponse> {
  const baseUrl = (instance.base_url ?? "").replace(/\/$/, "");
  const path = pathSegments.length
    ? `/${pathSegments.join("/")}`
    : "";
  const targetPath = `/api/v1${path}`;
  const targetUrl = `${baseUrl}${targetPath}`;

  // Do not forward portal-only params to Flowise (instanceId, tenantId, appType, name)
  const url = new URL(request.url);
  const flowiseParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!["instanceId", "tenantId", "appType", "name"].includes(key)) {
      flowiseParams.set(key, value);
    }
  });
  const search = flowiseParams.toString();
  const fullTarget = search ? `${targetUrl}?${search}` : targetUrl;

  const headers: HeadersInit = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
  };
  // Prefer Bearer (dashboard API key). If env has username/password, try Basic auth as fallback for app-level.
  const username = process.env.FLOWISE_USERNAME?.trim();
  const password = process.env.FLOWISE_PASSWORD?.trim();
  if (instance.api_key_encrypted) {
    headers["Authorization"] = `Bearer ${instance.api_key_encrypted}`;
    headers["x-api-key"] = instance.api_key_encrypted;
  } else if (username && password) {
    headers["Authorization"] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text();
      if (body) init.body = body;
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(fullTarget, init);
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (res.status === 401) {
      const keySent = Boolean(instance.api_key_encrypted);
      const keyLen = instance.api_key_encrypted?.length ?? 0;
      const upstreamMsg =
        data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : "";
      const authUsed = instance.api_key_encrypted ? "Bearer (API key)" : username && password ? "Basic (username/password)" : "none";
      console.warn("[Flowise proxy] 401 from", fullTarget, "| auth:", authUsed, "| keyLength:", keyLen, "| upstream:", upstreamMsg || data);
      let hint = keySent
        ? "Flowise returned 401. Use the key from the same instance as FLOWISE_URL (Settings → API Keys). If the key contains a slash, quote it: FLOWISE_API_KEY=\"key\". For app-level JWT (v3+), Flowise may require login; dashboard API keys may only work for chatflow-level."
        : "No API key sent. Set FLOWISE_API_KEY in supabase-mt/.env.local and restart.";
      if (upstreamMsg) hint += ` Upstream: ${upstreamMsg}`;
      return NextResponse.json(
        {
          message: hint,
          keySent,
          keyLength: keySent ? keyLen : undefined,
          authUsed,
          debugUrl: "/api/backoffice/flowise-debug",
          upstream: data,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Flowise proxy error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Proxy error" },
      { status: 500 }
    );
  }
}

/**
 * Forward request to n8n: base_url + /api/v1 + pathSegments, X-N8N-API-KEY: api_key.
 */
export async function forwardToN8n(
  instance: AppInstance,
  pathSegments: string[],
  request: Request
): Promise<NextResponse> {
  const baseUrl = (instance.base_url ?? "").replace(/\/$/, "");
  const path = pathSegments.length
    ? `/${pathSegments.join("/")}`
    : "";
  const targetPath = `/api/v1${path}`;
  const targetUrl = `${baseUrl}${targetPath}`;

  const url = new URL(request.url);
  const n8nParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!["instanceId", "tenantId", "appType", "name"].includes(key)) {
      n8nParams.set(key, value);
    }
  });
  const search = n8nParams.toString();
  const fullTarget = search ? `${targetUrl}?${search}` : targetUrl;

  const headers: HeadersInit = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
  };
  if (instance.api_key_encrypted) {
    headers["X-N8N-API-KEY"] = instance.api_key_encrypted;
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text();
      if (body) init.body = body;
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(fullTarget, init);
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (res.status === 401) {
      const keySent = Boolean(instance.api_key_encrypted);
      const upstreamMsg =
        data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : "";
      const hint = keySent
        ? "n8n rejected the API key. Use the key from n8n Settings → API (same instance as N8N_URL). Keys are JWT and can expire—regenerate if needed."
        : "No API key was sent. Set N8N_API_KEY in .env.local and restart the dev server.";
      return NextResponse.json(
        {
          message: upstreamMsg ? `${hint} Upstream: ${upstreamMsg}` : hint,
          keySent,
          upstream: data,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("n8n proxy error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Proxy error" },
      { status: 500 }
    );
  }
}

const NEXTCLOUD_ENV_PASSWORD_KEYS = [
  "NEXTCLOUD_ADMIN_PASSWORD",
  "NEXTCLOUD_ADMIN_APP_PASSWORD",
] as const;

export function getNextcloudPassword(instance: AppInstance): string | null {
  if (instance.id === ENV_INSTANCE_IDS.nextcloud) {
    for (const key of NEXTCLOUD_ENV_PASSWORD_KEYS) {
      const v = getEnvFromFile(key);
      if (v) return v;
    }
    return null;
  }
  const pass = instance.settings?.nextcloud_password;
  return typeof pass === "string" ? pass.trim() || null : null;
}

/**
 * Forward request to Nextcloud OCS API: base_url + /ocs/v1.php/cloud + pathSegments, Basic Auth, OCS-APIRequest: true.
 */
export async function forwardToNextcloud(
  instance: AppInstance,
  pathSegments: string[],
  request: Request
): Promise<NextResponse> {
  const baseUrl = (instance.base_url ?? "").replace(/\/$/, "");
  const path = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  const targetPath = `/ocs/v1.php/cloud${path}`;
  const targetUrl = `${baseUrl}${targetPath}`;

  const url = new URL(request.url);
  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!["instanceId", "tenantId", "appType", "name"].includes(key)) {
      params.set(key, value);
    }
  });
  if (!params.has("format")) params.set("format", "json");
  const search = params.toString();
  const fullTarget = search ? `${targetUrl}?${search}` : targetUrl;

  const username = (instance.api_key_encrypted ?? "").trim();
  const password = getNextcloudPassword(instance);
  if (!username || !password) {
    return NextResponse.json(
      {
        message:
          "Nextcloud credentials missing. Set NEXTCLOUD_ADMIN_USER and NEXTCLOUD_ADMIN_PASSWORD (or NEXTCLOUD_ADMIN_APP_PASSWORD) in supabase-mt/.env.local for env-nextcloud.",
      },
      { status: 503 }
    );
  }

  const headers: HeadersInit = {
    "OCS-APIRequest": "true",
    "Content-Type": request.headers.get("content-type") ?? "application/json",
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  };

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text();
      if (body) init.body = body;
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(fullTarget, init);
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (res.status === 401) {
      return NextResponse.json(
        {
          message:
            "Nextcloud rejected credentials. Check NEXTCLOUD_ADMIN_USER and NEXTCLOUD_ADMIN_PASSWORD (or app password) in .env.local.",
          upstream: data,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data ?? {}, { status: res.status });
  } catch (err) {
    console.error("Nextcloud proxy error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Proxy error" },
      { status: 500 }
    );
  }
}

/**
 * Forward request to Coolify: base_url + /api/v1 + pathSegments, Authorization: Bearer api_key.
 */
export async function forwardToCoolify(
  instance: AppInstance,
  pathSegments: string[],
  request: Request
): Promise<NextResponse> {
  const baseUrl = (instance.base_url ?? "").replace(/\/$/, "");
  const path = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  const targetPath = `/api/v1${path}`;
  const targetUrl = `${baseUrl}${targetPath}`;

  const url = new URL(request.url);
  const params = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!["instanceId", "tenantId", "appType", "name"].includes(key)) {
      params.set(key, value);
    }
  });
  const search = params.toString();
  const fullTarget = search ? `${targetUrl}?${search}` : targetUrl;

  const headers: HeadersInit = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
  };
  if (instance.api_key_encrypted) {
    headers["Authorization"] = `Bearer ${instance.api_key_encrypted}`;
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.text();
      if (body) init.body = body;
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(fullTarget, init);
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (res.status === 401) {
      const keySent = Boolean(instance.api_key_encrypted);
      const upstreamMsg =
        data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : "";
      const hint = keySent
        ? "Coolify rejected the API key. Check COOLIFY_API_KEY in supabase-mt/.env.local (Keys & Tokens → API tokens in Coolify)."
        : "No API key sent. Set COOLIFY_API_KEY in supabase-mt/.env.local and restart.";
      return NextResponse.json(
        {
          message: upstreamMsg ? `${hint} Upstream: ${upstreamMsg}` : hint,
          keySent,
          upstream: data,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Coolify proxy error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Proxy error" },
      { status: 500 }
    );
  }
}

export async function handleBackofficeProxy(
  request: Request,
  pathSegments: string[],
  appType: "flowise" | "n8n" | "nextcloud" | "coolify"
): Promise<NextResponse> {
  const instance = await resolveInstance(request);
  if (!instance) {
    const url = new URL(request.url);
    const instanceId = url.searchParams.get("instanceId");
    const isEnvDefault =
      instanceId === ENV_INSTANCE_IDS.flowise ||
      instanceId === ENV_INSTANCE_IDS.n8n ||
      instanceId === ENV_INSTANCE_IDS.nextcloud ||
      instanceId === ENV_INSTANCE_IDS.coolify;
    const msg =
      appType === "n8n"
        ? "N8N_URL and N8N_API_KEY"
        : appType === "nextcloud"
          ? "NEXTCLOUD_URL, NEXTCLOUD_ADMIN_USER and NEXTCLOUD_ADMIN_PASSWORD"
          : appType === "coolify"
            ? "COOLIFY_URL (or COOLIFY_API_HOST) and COOLIFY_API_KEY"
            : "FLOWISE_URL and FLOWISE_API_KEY";
    const message = isEnvDefault
      ? `Env default (${instanceId}) not configured. Set ${msg} in supabase-mt/.env.local and restart.`
      : "Instance not found. Provide instanceId or tenantId+appType (+ optional name).";
    return NextResponse.json(
      { message },
      { status: isEnvDefault ? 503 : 400 }
    );
  }
  if (instance.app_type !== appType) {
    return NextResponse.json(
      { message: "Instance app type does not match." },
      { status: 400 }
    );
  }
  const allowed = await canAccessInstance(instance);
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  if (appType === "flowise") {
    return forwardToFlowise(instance, pathSegments, request);
  }
  if (appType === "nextcloud") {
    return forwardToNextcloud(instance, pathSegments, request);
  }
  if (appType === "coolify") {
    return forwardToCoolify(instance, pathSegments, request);
  }
  return forwardToN8n(instance, pathSegments, request);
}
