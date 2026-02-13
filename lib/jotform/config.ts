/**
 * JotForm API configuration.
 * Server-only. Do not import in client components.
 */

const baseUrl =
  process.env.NEXT_PUBLIC_JOTFORM_BASE_URL || "https://api.jotform.com"

export function getJotformBaseUrl(): string {
  return baseUrl.replace(/\/$/, "")
}

export function getJotformApiKey(): string {
  const key = process.env.JOTFORM_API_KEY
  if (!key || key.trim() === "") {
    throw new Error(
      "JOTFORM_API_KEY is required for JotForm operations. Set it in .env"
    )
  }
  return key
}

export function getJotformWebhookSecret(): string | undefined {
  return process.env.JOTFORM_WEBHOOK_SECRET
}
