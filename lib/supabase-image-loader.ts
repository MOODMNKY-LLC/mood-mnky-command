/**
 * Next.js custom image loader.
 * - Supabase Storage: converts object/public to render/image URLs (width, quality).
 * - Local /verse/ paths: return as-is to bypass optimizer (avoids 404 for public assets).
 * - Other URLs (Shopify CDN, etc.): routes through Next.js image optimization.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations#nextjs-loader
 * @see https://nextjs.org/docs/messages/next-image-missing-loader-width
 */
export default function supabaseLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  try {
    const url = new URL(src, "http://n")
    const isSupabaseStorage = url.pathname.includes("/storage/v1/object/public/")

    if (isSupabaseStorage) {
      const renderPath = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      )
      const params = new URLSearchParams()
      params.set("width", String(width))
      params.set("quality", String(quality ?? 80))
      return `${url.origin}${renderPath}?${params.toString()}`
    }

    // Local paths like /verse/mood-mnky-3d.png: serve directly from public/ to avoid
    // Image Optimization fetching issues in dev/production.
    if (src.startsWith("/") && !src.startsWith("//")) {
      return src
    }
  } catch {
    // Invalid URL, fall through
  }

  // For remote URLs (Shopify, etc.), use Next.js image optimization
  // Bypass Next.js optimizer for Shopify CDN and myshopify hosts when Node fetch may be blocked
  try {
    const parsed = new URL(src)
    const host = parsed.hostname
    if (host === "cdn.shopify.com" || host.endsWith(".myshopify.com")) {
      // return original src directly to avoid server-side proxying issues (TLS/enterprise networks)
      return src
    }
  } catch {
    // fall back to optimizer
  }

  const q = quality ?? 75
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`
}
