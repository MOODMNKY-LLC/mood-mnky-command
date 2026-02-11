/**
 * Next.js custom image loader for Supabase Storage.
 * Converts object/public URLs to render/image URLs for on-the-fly transforms.
 * Requires Supabase Pro plan for image transformations.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations#nextjs-loader
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
  // Supabase storage URL: .../storage/v1/object/public/bucket/path
  // Transform URL: .../storage/v1/render/image/public/bucket/path?width=X&quality=Y
  try {
    const url = new URL(src)
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
    // Invalid URL, return as-is
  }
  return src
}
