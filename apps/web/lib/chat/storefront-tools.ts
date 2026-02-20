import { tool } from "ai"
import { z } from "zod"
import { storefrontFetch } from "@/lib/shopify/storefront-client"
import {
  PRODUCT_SEARCH_QUERY,
  SHOP_POLICIES_QUERY,
} from "@/lib/shopify/storefront-queries"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Search products via Storefront API for the storefront assistant.
 */
export const searchProductsTool = tool({
  description:
    "Search products by keyword, product name, scent, or type. Use when visitors ask about candles, fragrances, soaps, or specific products. Returns product title, handle, price, and image URL.",
  inputSchema: z.object({
    query: z.string().describe("Search term (e.g. 'candle', 'vanilla', 'lavender soap')"),
    limit: z.number().min(1).max(10).default(5).optional(),
  }),
  execute: async ({ query, limit = 5 }) => {
    try {
      const data = await storefrontFetch<{
        search?: { edges?: Array<{ node?: unknown }> }
      }>(PRODUCT_SEARCH_QUERY, { query, first: limit })

      const edges = data?.search?.edges ?? []
      const products = edges
        .map((e) => e.node)
        .filter((n): n is Record<string, unknown> => n != null && typeof n === "object")
        .map((p) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          url: p.handle ? `/products/${p.handle}` : null,
          price: p.priceRange?.minVariantPrice?.amount
            ? `${(p.priceRange as { minVariantPrice?: { amount: string; currencyCode: string } })?.minVariantPrice?.currencyCode ?? "USD"} ${(p.priceRange as { minVariantPrice?: { amount: string } })?.minVariantPrice?.amount}`
            : null,
          imageUrl: (p.featuredImage as { url?: string } | null)?.url ?? null,
        }))

      return { products, count: products.length }
    } catch (err) {
      return {
        products: [],
        count: 0,
        error: err instanceof Error ? err.message : "Product search failed",
      }
    }
  },
})

/**
 * Fetch shop policies (shipping, refund, privacy, terms) for the storefront assistant.
 */
export const getShopPoliciesTool = tool({
  description:
    "Fetch the shop's policies: shipping, refund/returns, privacy, and terms of service. Use when visitors ask about shipping costs, delivery times, returns, refunds, or policy questions.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const data = await storefrontFetch<{
        shop?: {
          name?: string
          shippingPolicy?: { title: string; body: string; url: string }
          refundPolicy?: { title: string; body: string; url: string }
          privacyPolicy?: { title: string; body: string; url: string }
          termsOfService?: { title: string; body: string; url: string }
        }
      }>(SHOP_POLICIES_QUERY)

      const shop = data?.shop
      if (!shop) return { error: "Shop data not available" }

      return {
        shopName: shop.name,
        shippingPolicy: shop.shippingPolicy
          ? {
              title: shop.shippingPolicy.title,
              body: shop.shippingPolicy.body?.slice(0, 2000) ?? "",
              url: shop.shippingPolicy.url,
            }
          : null,
        refundPolicy: shop.refundPolicy
          ? {
              title: shop.refundPolicy.title,
              body: shop.refundPolicy.body?.slice(0, 2000) ?? "",
              url: shop.refundPolicy.url,
            }
          : null,
        privacyPolicy: shop.privacyPolicy ? shop.privacyPolicy : null,
        termsOfService: shop.termsOfService ? shop.termsOfService : null,
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Failed to fetch policies",
      }
    }
  },
})

/**
 * Search verse_blog_posts from Supabase for the storefront assistant.
 */
export const searchVerseBlogTool = tool({
  description:
    "Search the MNKY VERSE blog for articles about fragrances, candles, self-care, or brand stories. Use when visitors ask about blog content, articles, or inspiration.",
  inputSchema: z.object({
    query: z.string().describe("Search term for blog titles or content"),
    limit: z.number().min(1).max(5).default(3).optional(),
  }),
  execute: async ({ query, limit = 3 }) => {
    try {
      const supabase = createAdminClient()
      const p = query.replace(/%/g, "\\%").replace(/_/g, "\\_")
      const { data, error } = await supabase
        .from("verse_blog_posts")
        .select("id, title, slug, excerpt, published_at")
        .or(`title.ilike.%${p}%,excerpt.ilike.%${p}%,content.ilike.%${p}%`)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit)

      if (error) return { posts: [], error: error.message }

      const baseUrl =
        process.env.NEXT_PUBLIC_VERSE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://mnky-command.moodmnky.com"
      const posts = (data ?? []).map((post) => ({
        ...post,
        url: `${baseUrl}/verse/blog/${post.slug ?? post.id}`,
      }))

      return { posts, count: posts.length }
    } catch (err) {
      return {
        posts: [],
        error: err instanceof Error ? err.message : "Blog search failed",
      }
    }
  },
})

/**
 * Search products via Storefront API for VERSE chat (member portal).
 * Returns URLs in VERSE format: /verse/products/{handle}
 */
export const searchVerseProductsTool = tool({
  description:
    "Search MOOD MNKY products (candles, soaps, room sprays, fragrances) by keyword, scent, or type. Use when members ask for product recommendations, gift ideas, or to find items by mood or notes. Returns product title, handle, price, image, and link to MNKY VERSE Shop.",
  inputSchema: z.object({
    query: z.string().describe("Search term (e.g. 'vanilla candle', 'lavender soap', 'relaxing scent')"),
    limit: z.number().min(1).max(10).default(5).optional(),
  }),
  execute: async ({ query, limit = 5 }) => {
    try {
      const data = await storefrontFetch<{
        search?: { edges?: Array<{ node?: unknown }> }
      }>(PRODUCT_SEARCH_QUERY, { query, first: limit })

      const edges = data?.search?.edges ?? []
      const products = edges
        .map((e) => e.node)
        .filter((n): n is Record<string, unknown> => n != null && typeof n === "object")
        .map((p) => {
          const handle = p.handle as string | undefined
          const url = handle ? `/verse/products/${handle}` : null
          return {
            id: p.id,
            title: p.title,
            handle,
            url,
            price: p.priceRange?.minVariantPrice?.amount
              ? `${(p.priceRange as { minVariantPrice?: { amount: string; currencyCode: string } })?.minVariantPrice?.currencyCode ?? "USD"} ${(p.priceRange as { minVariantPrice?: { amount: string } })?.minVariantPrice?.amount}`
              : null,
            imageUrl: (p.featuredImage as { url?: string } | null)?.url ?? null,
          }
        })

      return { products, count: products.length }
    } catch (err) {
      return {
        products: [],
        count: 0,
        error: err instanceof Error ? err.message : "Product search failed",
      }
    }
  },
})

/**
 * Search assistant_knowledge (FAQ, About, policies) from Supabase for the storefront assistant.
 */
export const searchKnowledgeBaseTool = tool({
  description:
    "Search the store's knowledge base (FAQ, About MOOD MNKY, shipping info, policies). Use when visitors ask about the brand, how it works, shipping, returns, or general store questions.",
  inputSchema: z.object({
    query: z.string().describe("Search term for FAQs, policies, about, shipping, etc."),
    limit: z.number().min(1).max(5).default(3).optional(),
  }),
  execute: async ({ query, limit = 3 }) => {
    try {
      const supabase = createAdminClient()
      const escaped = query.replace(/%/g, "\\%").replace(/_/g, "\\_")
      const { data, error } = await supabase
        .from("assistant_knowledge")
        .select("id, title, content, source")
        .or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`)
        .limit(limit)

      if (error) return { chunks: [], error: error.message }

      const chunks = (data ?? []).map((row) => ({
        title: row.title,
        content: (row.content ?? "").slice(0, 1500),
        source: row.source,
      }))

      return { chunks, count: chunks.length }
    } catch (err) {
      return {
        chunks: [],
        error: err instanceof Error ? err.message : "Knowledge base search failed",
      }
    }
  },
})
