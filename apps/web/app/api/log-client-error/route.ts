import { NextRequest, NextResponse } from "next/server";

/**
 * POST: Log client-side errors (e.g. from VerseErrorBoundary) for debugging.
 * Payload is logged to stdout so it appears in Vercel logs; no PII stored.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message : "";
    const stack = typeof body.stack === "string" ? body.stack : "";
    const componentStack =
      typeof body.componentStack === "string" ? body.componentStack : "";
    const userAgent =
      typeof body.userAgent === "string" ? body.userAgent : "";
    const url = typeof body.url === "string" ? body.url : "";
    const viewport =
      typeof body.viewport === "string" ? body.viewport : "";
    const section =
      typeof body.section === "string" ? body.section : "";

    const logPayload = {
      ts: new Date().toISOString(),
      section,
      message,
      stack: stack.slice(0, 2000),
      componentStack: componentStack.slice(0, 1500),
      userAgent: userAgent.slice(0, 300),
      url: url.slice(0, 500),
      viewport,
    };

    console.error("[log-client-error]", JSON.stringify(logPayload));
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
}
