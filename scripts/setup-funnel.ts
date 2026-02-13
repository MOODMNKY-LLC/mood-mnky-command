/**
 * CLI: Create a funnel and register its JotForm webhook.
 * Uses Supabase service role and JotForm API directly (no HTTP API calls).
 *
 * Usage:
 *   pnpm funnel:setup --name "Fragrance Intake" --form-id 241234567890
 *   pnpm funnel:setup --name "Fragrance Intake" --form-id 241234567890 --description "Optional description"
 *
 * Requires in .env:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   JOTFORM_API_KEY
 *   NEXT_PUBLIC_APP_URL or VERCEL_URL (for webhook URL)
 */

import { config } from "dotenv"
import { join } from "path"

config({ path: join(process.cwd(), ".env"), override: true })

import { createAdminClient } from "../lib/supabase/admin"
import { createWebhook } from "../lib/jotform/client"
import { getJotformWebhookSecret } from "../lib/jotform/config"

function parseArgs(): { name: string; formId: string; description?: string } {
  const args = process.argv.slice(2)
  let name = ""
  let formId = ""
  let description: string | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      name = args[++i]
    } else if ((args[i] === "--form-id" || args[i] === "--formId") && args[i + 1]) {
      formId = args[++i]
    } else if (args[i] === "--description" && args[i + 1]) {
      description = args[++i]
    }
  }

  if (!name || !formId) {
    console.error("Usage: pnpm funnel:setup --name <name> --form-id <jotform-form-id> [--description <desc>]")
    process.exit(1)
  }

  return { name, formId, description }
}

function getWebhookBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000"
  return url.replace(/\/$/, "")
}

async function main() {
  const { name, formId, description } = parseArgs()

  const supabase = createAdminClient()

  const { data: funnel, error: insertError } = await supabase
    .from("funnel_definitions")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      provider: "jotform",
      provider_form_id: formId.trim(),
      status: "draft",
    })
    .select("id, name, provider_form_id, status")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      console.error("A funnel with this JotForm form ID already exists.")
      process.exit(1)
    }
    console.error("Failed to create funnel:", insertError.message)
    process.exit(1)
  }

  const baseUrl = getWebhookBaseUrl()
  const secret = getJotformWebhookSecret()
  const webhookPath = secret
    ? `/api/jotform/webhook?token=${encodeURIComponent(secret)}`
    : "/api/jotform/webhook"
  const webhookUrl = `${baseUrl}${webhookPath}`

  try {
    const webhookId = await createWebhook(formId.trim(), webhookUrl)

    const { error: updateError } = await supabase
      .from("funnel_definitions")
      .update({
        webhook_id: webhookId,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", funnel.id)

    if (updateError) {
      console.error("Funnel created but webhook update failed:", updateError.message)
      process.exit(1)
    }

    const runUrl = `${baseUrl}/funnels/run/${funnel.id}`

    console.log("Funnel created and webhook registered.")
    console.log("")
    console.log("Funnel ID:", funnel.id)
    console.log("Run URL:", runUrl)
    console.log("Webhook URL:", webhookUrl)
  } catch (err) {
    console.error("JotForm webhook registration failed:", err instanceof Error ? err.message : err)
    console.error("Funnel was created with status 'draft'. Register webhook via UI or retry after fixing JOTFORM_API_KEY.")
    process.exit(1)
  }
}

main()
