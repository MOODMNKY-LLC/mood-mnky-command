#!/usr/bin/env tsx
/**
 * Prints the webhook URL for JotForm registration.
 * Use when running locally with ngrok: set NEXT_PUBLIC_APP_URL to your ngrok URL first.
 *
 * Usage: pnpm webhook:url
 */

import { config } from "dotenv"
import { join } from "path"
config({ path: join(process.cwd(), ".env"), override: true })

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000"

const secret = process.env.JOTFORM_WEBHOOK_SECRET
const path = secret ? `/api/jotform/webhook?token=${encodeURIComponent(secret)}` : "/api/jotform/webhook"
const webhookUrl = `${baseUrl.replace(/\/$/, "")}${path}`

console.log("Webhook URL for JotForm registration:")
console.log(webhookUrl)
if (baseUrl === "http://localhost:3000") {
  console.log("")
  console.log("Note: localhost is not reachable by JotForm. Use ngrok:")
  console.log("  1. Run: ngrok http 3000")
  console.log("  2. Set NEXT_PUBLIC_APP_URL=https://YOUR-NGROK-URL.ngrok-free.app")
  console.log("  3. Restart app and run this script again")
}
