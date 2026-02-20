import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { inngest } from "@/lib/inngest/client"
import { createAdminClient } from "@/lib/supabase/admin"

const HMAC_HEADER = "x-shopify-hmac-sha256"

function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? process.env.SHOPIFY_API_SECRET
  if (!secret || !hmacHeader) return false
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64")
  try {
    return timingSafeEqual(Buffer.from(digest, "base64"), Buffer.from(hmacHeader, "base64"))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get(HMAC_HEADER)
  if (!verifyShopifyHmac(rawBody, hmac)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: {
    id?: number
    order_number?: number
    total_price?: string
    customer?: { id?: number; email?: string }
    [key: string]: unknown
  }
  try {
    payload = JSON.parse(rawBody) as typeof payload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const topic = request.headers.get("x-shopify-topic") ?? ""
  const shop = request.headers.get("x-shopify-shop-domain") ?? ""

  if (topic === "orders/paid") {
    const orderId = String(payload.id ?? payload.order_number ?? "")
    const subtotal = parseFloat(String(payload.total_price ?? 0)) || 0
    let profileId: string | undefined
    const customerId = payload.customer?.id
    const customerEmail = payload.customer?.email
    const supabase = createAdminClient()

    if (customerId) {
      const { data: byCustomerId } = await supabase
        .from("profiles")
        .select("id")
        .eq("shopify_customer_id", String(customerId))
        .single()
      profileId = byCustomerId?.id

      if (!profileId && customerEmail) {
        const { data: byEmail } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", String(customerEmail).toLowerCase())
          .single()
        if (byEmail?.id) {
          profileId = byEmail.id
          await supabase
            .from("profiles")
            .update({ shopify_customer_id: String(customerId) })
            .eq("id", byEmail.id)
        }
      }
    }

    await inngest.send({
      name: "shopify/order.paid",
      data: { orderId, profileId, subtotal, shop },
    })
  }

  if (topic === "orders/cancelled" || topic === "refunds/create") {
    await inngest.send({
      name: "shopify/order.cancelled_or_refunded",
      data: { payload, shop },
    })
  }

  return NextResponse.json({ ok: true })
}
