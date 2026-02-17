/**
 * Next.js custom image loader.
 * - Supabase Storage: converts object/public to render/image URLs (width, quality).
 * - Other URLs (local, Shopify CDN, etc.): routes through Next.js image optimization
 *   so width is included and images are properly resized.
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
  } catch {
    // Invalid URL, fall through
  }

  // For local and remote URLs (Shopify, etc.), use Next.js image optimization
  // so width is included in the URL and the loader implements resize correctly.
  const q = quality ?? 75
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`
}
