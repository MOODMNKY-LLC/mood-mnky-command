import { NextResponse } from "next/server"
import * as jose from "jose"

const JWT_SECRET = process.env.APP_PROXY_JWT_SECRET ?? process.env.MOODMNKY_API_KEY
const JWT_EXPIRY = "15m"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get("shop")

  if (!JWT_SECRET) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  const secret = new TextEncoder().encode(JWT_SECRET)
  const token = await new jose.SignJWT({ shop: shop ?? undefined })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .setIssuedAt()
    .sign(secret)

  return NextResponse.json({ token })
}
