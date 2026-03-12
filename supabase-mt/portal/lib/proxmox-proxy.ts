import { NextResponse } from "next/server";
import { getEnvFromFile } from "@/lib/env-file";

export type ProxmoxConfig = {
  baseUrl: string;
  auth: { type: "token"; tokenId: string; tokenSecret: string } | { type: "ticket"; ticket: string; csrf: string };
};

let ticketCache: { ticket: string; csrf: string; expiresAt: number } | null = null;
const TICKET_TTL_MS = 55 * 60 * 1000; // 55 min (tickets last 2h)

/**
 * Resolve Proxmox config from env. Prefer API token; fallback to username/password (ticket).
 */
export async function getProxmoxConfig(): Promise<ProxmoxConfig | null> {
  const host = getEnvFromFile("PROXMOX_API_HOST")?.trim();
  if (!host) return null;

  const baseUrl = host.startsWith("http") ? host.replace(/\/$/, "") : `https://${host}`;

  const tokenId = getEnvFromFile("PROXMOX_API_TOKEN_ID")?.trim();
  const tokenSecret = getEnvFromFile("PROXMOX_API_TOKEN_SECRET")?.trim();
  if (tokenId && tokenSecret) {
    return { baseUrl, auth: { type: "token", tokenId, tokenSecret } };
  }

  const user = getEnvFromFile("PROXMOX_API_USER")?.trim();
  const password = getEnvFromFile("PROXMOX_API_PASSWORD")?.trim();
  if (user && password) {
    const ticket = await fetchProxmoxTicket(baseUrl, user, password);
    if (ticket) return { baseUrl, auth: { type: "ticket", ticket: ticket.ticket, csrf: ticket.csrf } };
  }

  return null;
}

async function fetchProxmoxTicket(
  baseUrl: string,
  username: string,
  password: string
): Promise<{ ticket: string; csrf: string } | null> {
  if (ticketCache && ticketCache.expiresAt > Date.now()) {
    return { ticket: ticketCache.ticket, csrf: ticketCache.csrf };
  }
  const url = `${baseUrl}/api2/json/access/ticket`;
  const body = new URLSearchParams({ username, password });
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (err) {
    console.error("[Proxmox] ticket fetch error:", err);
    return null;
  }
  if (!res.ok) {
    console.warn("[Proxmox] ticket failed:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { data?: { ticket?: string; CSRFPreventionToken?: string } };
  const ticket = data?.data?.ticket;
  const csrf = data?.data?.CSRFPreventionToken;
  if (!ticket || !csrf) return null;
  ticketCache = { ticket, csrf, expiresAt: Date.now() + TICKET_TTL_MS };
  return { ticket, csrf };
}

/**
 * Forward request to Proxmox VE API. Uses token or ticket auth. Caller must enforce platform_admin.
 */
export async function forwardToProxmox(
  pathSegments: string[],
  request: Request
): Promise<NextResponse> {
  const config = await getProxmoxConfig();
  if (!config) {
    return NextResponse.json(
      {
        message:
          "Proxmox not configured. Set PROXMOX_API_HOST and either (PROXMOX_API_TOKEN_ID + PROXMOX_API_TOKEN_SECRET) or (PROXMOX_API_USER + PROXMOX_API_PASSWORD) in supabase-mt/.env.local.",
      },
      { status: 503 }
    );
  }

  const path = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  const targetPath = `/api2/json${path}`;
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  const targetUrl = search ? `${config.baseUrl}${targetPath}?${search}` : `${config.baseUrl}${targetPath}`;

  const headers: HeadersInit = {
    "Content-Type": request.headers.get("content-type") ?? "application/json",
  };

  if (config.auth.type === "token") {
    headers["Authorization"] = `PVEAPIToken=${config.auth.tokenId}=${config.auth.tokenSecret}`;
  } else {
    headers["Cookie"] = `PVEAuthCookie=${config.auth.ticket}`;
    if (["POST", "PUT", "DELETE"].includes(request.method)) {
      headers["CSRFPreventionToken"] = config.auth.csrf;
    }
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
    const res = await fetch(targetUrl, init);
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
            "Proxmox returned 401. Check PROXMOX_API_TOKEN_ID/TOKEN_SECRET or PROXMOX_API_USER/PASSWORD in .env.local. For token, use the value from Datacenter → Permissions → API Tokens.",
          upstream: data,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[Proxmox] proxy error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Proxy error" },
      { status: 500 }
    );
  }
}
