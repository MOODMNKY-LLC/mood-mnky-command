import { createHmac, timingSafeEqual } from "crypto"

/**
 * Verify Shopify app proxy request signature.
 * See: https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies
 * Params are sorted by key, key=value concatenated (no separator), HMAC-SHA256 hex with app secret.
 */
export function verifyShopifyProxySignature(
  searchParams: URLSearchParams,
  secret: string
): { valid: boolean; signature: string | null } {
  const signature = searchParams.get("signature")
  if (!signature || !secret) return { valid: false, signature: null }

  const entries = Array.from(searchParams.entries())
    .filter(([k]) => k !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
  const sortedString = entries.map(([k, v]) => `${k}=${v}`).join("")
  const calculated = createHmac("sha256", secret)
    .update(sortedString, "utf8")
    .digest("hex")
  try {
    const valid =
      signature.length === calculated.length &&
      timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(calculated, "hex"))
    return { valid, signature }
  } catch {
    return { valid: false, signature }
  }
}

export function getShopifyProxySecret(): string | undefined {
  return process.env.SHOPIFY_WEBHOOK_SECRET ?? process.env.SHOPIFY_API_SECRET
}

export function getLoggedInCustomerId(searchParams: URLSearchParams): string | null {
  const id = searchParams.get("logged_in_customer_id")
  if (id === null || id === "") return null
  return id
}
