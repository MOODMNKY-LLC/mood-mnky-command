import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/backoffice-instance";

/**
 * GET: Dev-only diagnostic for Flowise env (platform_admin only).
 * Returns whether FLOWISE_API_KEY is loaded, runs a simple Flowise API call per docs,
 * and reports status so you can verify without exposing the key.
 *
 * Flowise docs: List chatflows = GET /api/v1/chatflows with Authorization: Bearer <api-key>
 * https://docs.flowiseai.com/api-reference/chatflows
 * https://docs.flowiseai.com/configuration/authorization/chatflow-level
 */
export async function GET() {
  const allowed = await isPlatformAdmin();
  if (!allowed) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }
  const raw = process.env.FLOWISE_API_KEY;
  const key = typeof raw === "string" ? raw.trim() : "";
  const flowiseUrl = (process.env.FLOWISE_URL?.trim() ?? "").replace(/\/$/, "");
  let flowiseUrlHost: string | null = null;
  if (flowiseUrl) {
    try {
      flowiseUrlHost = new URL(flowiseUrl.startsWith("http") ? flowiseUrl : `https://${flowiseUrl}`).host;
    } catch {
      flowiseUrlHost = null;
    }
  }
  const cwd = process.cwd();
  const expectedEnvPath = "supabase-mt/.env.local";

  // Simple API call per Flowise docs: GET /api/v1/chatflows with Bearer token
  let testResult: { status: number; ok: boolean; message?: string } | null = null;
  if (flowiseUrl && key) {
    try {
      const url = `${flowiseUrl}/api/v1/chatflows`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${key}`,
        },
      });
      testResult = {
        status: res.status,
        ok: res.ok,
        message: res.status === 401
          ? "Flowise returned 401: key rejected or instance uses App-level JWT (v3.0.1+). See docs.flowiseai.com/configuration/authorization/app-level"
          : res.ok
            ? "OK"
            : res.statusText,
      };
    } catch (err) {
      testResult = {
        status: 0,
        ok: false,
        message: err instanceof Error ? err.message : "Request failed",
      };
    }
  }

  return NextResponse.json({
    flowiseUrlSet: flowiseUrl.length > 0,
    flowiseUrlHost,
    flowiseKeySet: key.length > 0,
    flowiseKeyLength: key.length,
    flowiseKeyContainsSlash: key.includes("/"),
    envLocation: {
      cwd,
      expectedFile: expectedEnvPath,
      note: "Dev script loads ../.env.local relative to CWD; put FLOWISE_* in supabase-mt/.env.local.",
    },
    simpleApiTest: testResult,
    hint: key.length === 0
      ? "FLOWISE_API_KEY is missing or empty. Set it in .env.local and restart."
      : key.includes("/") && key.length < 50
        ? "Key contains '/' — quote in .env.local: FLOWISE_API_KEY=\"your-key\""
        : null,
  });
}
