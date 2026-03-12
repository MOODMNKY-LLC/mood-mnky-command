import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  FFLOGS_AUTHORIZE_URL,
  generatePKCE,
} from "@/lib/fflogs/client";

const COOKIE_NAME = "fflogs_oauth";
const COOKIE_MAX_AGE = 600;

export type FFLogsIntent = "link" | "signin";

function getClientId(): string {
  const id = process.env.FFLOGS_CLIENT_ID;
  if (!id) {
    throw new Error("FFLOGS_CLIENT_ID is not set");
  }
  return id;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const callbackUrl = `${origin}/auth/fflogs/callback`;

  const intentParam = request.nextUrl.searchParams.get("intent");
  const intent: FFLogsIntent =
    intentParam === "link" || intentParam === "signin" ? intentParam : "signin";

  const state = crypto.randomBytes(24).toString("base64url");
  const { codeVerifier, codeChallenge } = generatePKCE();

  const payload = JSON.stringify({
    state,
    codeVerifier,
    intent,
  });
  const cookieValue = Buffer.from(payload, "utf-8").toString("base64url");

  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: callbackUrl,
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    scope: "view-user-profile",
  });
  const redirectTo = `${FFLOGS_AUTHORIZE_URL}?${params.toString()}`;

  const res = NextResponse.redirect(redirectTo);
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
