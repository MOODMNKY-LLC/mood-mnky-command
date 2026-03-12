/**
 * Customer Account API metafield read/write for shopper profile sync.
 * Used to push display_name, bio, handle etc. from Supabase profiles to Shopify
 * customer metafields (visible in Admin, usable for personalization).
 */

import { customerAccountFetch, getCurrentCustomer } from "@/lib/shopify/customer-account-client"
import { CUSTOMER_METAFIELD_NAMESPACE } from "@/lib/shopify-admin-graphql"

export interface ShopperMetafields {
  nickname?: string
  bio?: string
  fragrance_preferences?: string // JSON string
  verse_handle?: string
  wishlist?: string // JSON string: string[]
  size_preferences?: string // JSON string: { clothing?, candle?, soap? }
  scent_personality?: string
}

const CUSTOMER_WITH_METAFIELDS_QUERY = `
  query GetCurrentCustomerWithMetafields {
    customer {
      id
      displayName
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      metafields(first: 25, namespace: "${CUSTOMER_METAFIELD_NAMESPACE}") {
        nodes {
          key
          namespace
          value
        }
      }
    }
  }
`

type CustomerWithMetafieldsPayload = {
  customer: {
    id: string
    displayName?: string
    firstName?: string
    lastName?: string
    emailAddress?: { emailAddress?: string }
    metafields: {
      nodes: Array<{ key: string; namespace: string; value: string }>
    }
  }
}

/**
 * Get current customer plus metafields in our namespace.
 * Returns parsed metafields for display/prefill in Dojo.
 */
export async function getCustomerMetafields(): Promise<{
  customer: { id: string; displayName?: string; email?: string }
  metafields: ShopperMetafields
} | null> {
  try {
    const data = await customerAccountFetch<CustomerWithMetafieldsPayload>(
      CUSTOMER_WITH_METAFIELDS_QUERY
    )
    const c = data?.customer
    if (!c) return null

    const metafields: ShopperMetafields = {}
    for (const node of c.metafields?.nodes ?? []) {
      if (node.key === "nickname") metafields.nickname = node.value
      else if (node.key === "bio") metafields.bio = node.value
      else if (node.key === "fragrance_preferences") metafields.fragrance_preferences = node.value
      else if (node.key === "verse_handle") metafields.verse_handle = node.value
      else if (node.key === "wishlist") metafields.wishlist = node.value
      else if (node.key === "size_preferences") metafields.size_preferences = node.value
      else if (node.key === "scent_personality") metafields.scent_personality = node.value
    }

    return {
      customer: {
        id: c.id,
        displayName: c.displayName ?? undefined,
        email: c.emailAddress?.emailAddress ?? undefined,
      },
      metafields,
    }
  } catch {
    return null
  }
}

export interface MetafieldInput {
  key: string
  type: string
  value: string
}

const METAFIELDS_SET_MUTATION = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        key
        namespace
        value
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`

type MetafieldsSetPayload = {
  metafieldsSet: {
    metafields: Array<{ key: string; namespace: string; value: string }> | null
    userErrors: Array<{ field?: string[]; message: string; code?: string }>
  }
}

/**
 * Set customer metafields via Customer Account API.
 * ownerId must be the current customer's GID (enforced by Customer Account API).
 * Throws on userErrors.
 */
export async function setCustomerMetafields(
  customerId: string,
  metafields: MetafieldInput[]
): Promise<void> {
  if (metafields.length === 0) return
  if (metafields.length > 25) {
    throw new Error("Maximum 25 metafields per request")
  }

  const ownerId = customerId.startsWith("gid://") ? customerId : `gid://shopify/Customer/${customerId}`

  const input = metafields.map((m) => ({
    ownerId,
    namespace: CUSTOMER_METAFIELD_NAMESPACE,
    key: m.key,
    type: m.type,
    value: m.value,
  }))

  const data = await customerAccountFetch<MetafieldsSetPayload>(METAFIELDS_SET_MUTATION, {
    metafields: input,
  })

  const result = data?.metafieldsSet
  if (!result) throw new Error("MetafieldsSet returned no data")

  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`MetafieldsSet failed: ${msg}`)
  }
}
