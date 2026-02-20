/**
 * Creates customer metafield definitions for MNKY Verse shopper profile sync.
 * Definitions grant Customer Account API read_write so linked shoppers can
 * update their metafields from Dojo/Verse profile.
 *
 * Run: pnpm shopify:setup-customer-metafields
 * Requires: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN (with write_metafield_definitions)
 */

import "dotenv/config"
import { ensureCustomerMetafieldDefinitions, isShopifyGraphQLConfigured } from "../lib/shopify-admin-graphql"

async function main() {
  if (!isShopifyGraphQLConfigured()) {
    console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN. Set in .env.local")
    process.exit(1)
  }
  console.log("Creating customer metafield definitions...")
  await ensureCustomerMetafieldDefinitions()
  console.log("Done. Check Shopify Admin → Settings → Custom data for Customer metafields.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
