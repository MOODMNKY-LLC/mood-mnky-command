import type { SupabaseClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const BUCKETS = {
  productImages: "product-images",
  aiGenerations: "ai-generations",
  brandAssets: "brand-assets",
  userAvatars: "user-avatars",
  privateDocuments: "private-documents",
} as const

export type BucketId = (typeof BUCKETS)[keyof typeof BUCKETS]

export interface TransformOptions {
  width?: number
  height?: number
  quality?: number
  format?: "origin" | "avif" | "webp"
  resize?: "cover" | "contain" | "fill"
}

export interface UploadOptions {
  cacheControl?: string
  contentType?: string
  upsert?: boolean
}

export interface MediaAsset {
  id: string
  user_id: string
  bucket_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  width: number | null
  height: number | null
  tags: string[]
  alt_text: string | null
  description: string | null
  linked_entity_type: string | null
  linked_entity_id: string | null
  public_url: string | null
  created_at: string
  updated_at: string
  category?: string | null
  source_model?: string | null
  generation_prompt?: string | null
}

// ---------------------------------------------------------------------------
// Bucket config (for validation in UI)
// ---------------------------------------------------------------------------

export const BUCKET_CONFIG: Record<
  BucketId,
  {
    label: string
    description: string
    maxSizeMB: number
    acceptedTypes: string[]
    isPublic: boolean
  }
> = {
  "product-images": {
    label: "Product Images",
    description: "Photos and images for Shopify products",
    maxSizeMB: 10,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
    isPublic: true,
  },
  "ai-generations": {
    label: "AI Generations",
    description: "AI-generated images and artwork",
    maxSizeMB: 25,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    isPublic: true,
  },
  "brand-assets": {
    label: "Brand Assets",
    description: "Logos, videos, PDFs, and brand materials",
    maxSizeMB: 25,
    acceptedTypes: [
      "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml",
      "video/mp4", "video/webm", "application/pdf",
    ],
    isPublic: true,
  },
  "user-avatars": {
    label: "User Avatars",
    description: "Profile pictures",
    maxSizeMB: 2,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    isPublic: true,
  },
  "private-documents": {
    label: "Private Documents",
    description: "Internal documents and files",
    maxSizeMB: 50,
    acceptedTypes: [],
    isPublic: false,
  },
}

// ---------------------------------------------------------------------------
// URL Builders
// ---------------------------------------------------------------------------

/**
 * Build a public CDN URL for a file in a public bucket.
 * Optionally apply image transformations (resize, format, quality).
 */
export function getPublicUrl(
  supabase: SupabaseClient,
  bucket: BucketId,
  path: string,
  transform?: TransformOptions,
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: transform
      ? {
          width: transform.width,
          height: transform.height,
          quality: transform.quality,
          format: transform.format,
          resize: transform.resize,
        }
      : undefined,
  })
  return data.publicUrl
}

/**
 * Generate a signed URL for private bucket files.
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: BucketId,
  path: string,
  expiresIn = 3600,
  transform?: TransformOptions,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn, {
    transform: transform
      ? {
          width: transform.width,
          height: transform.height,
          quality: transform.quality,
          format: transform.format,
          resize: transform.resize,
        }
      : undefined,
  })
  if (error) return null
  return data.signedUrl
}

/**
 * Convenience: get a thumbnail URL (300px wide, WebP, 80% quality)
 */
export function getThumbnailUrl(
  supabase: SupabaseClient,
  bucket: BucketId,
  path: string,
): string {
  return getPublicUrl(supabase, bucket, path, {
    width: 300,
    quality: 80,
    format: "webp",
    resize: "cover",
  })
}

/**
 * Convenience: get a medium-size URL (800px wide)
 */
export function getMediumUrl(
  supabase: SupabaseClient,
  bucket: BucketId,
  path: string,
): string {
  return getPublicUrl(supabase, bucket, path, {
    width: 800,
    quality: 85,
    format: "webp",
    resize: "contain",
  })
}

// ---------------------------------------------------------------------------
// File Operations
// ---------------------------------------------------------------------------

/**
 * Upload a file to a bucket. Path is scoped to userId automatically.
 */
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: BucketId,
  userId: string,
  fileName: string,
  file: File | Blob,
  options?: UploadOptions,
) {
  const path = `${userId}/${fileName}`
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: options?.cacheControl ?? "3600",
    contentType: options?.contentType ?? (file instanceof File ? file.type : undefined),
    upsert: options?.upsert ?? false,
  })
  if (error) throw error
  return { path: data.path, fullPath: data.fullPath }
}

/**
 * Delete a single file.
 */
export async function deleteFile(
  supabase: SupabaseClient,
  bucket: BucketId,
  path: string,
) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

/**
 * Delete multiple files.
 */
export async function deleteFiles(
  supabase: SupabaseClient,
  bucket: BucketId,
  paths: string[],
) {
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) throw error
}

/**
 * Move / rename a file within a bucket.
 */
export async function moveFile(
  supabase: SupabaseClient,
  bucket: BucketId,
  fromPath: string,
  toPath: string,
) {
  const { error } = await supabase.storage.from(bucket).move(fromPath, toPath)
  if (error) throw error
}

/**
 * Copy a file within a bucket.
 */
export async function copyFile(
  supabase: SupabaseClient,
  bucket: BucketId,
  fromPath: string,
  toPath: string,
) {
  const { error } = await supabase.storage.from(bucket).copy(fromPath, toPath)
  if (error) throw error
}

/**
 * List files in a folder within a bucket.
 */
export async function listFiles(
  supabase: SupabaseClient,
  bucket: BucketId,
  folder: string,
  options?: { limit?: number; offset?: number; sortBy?: { column: string; order: "asc" | "desc" }; search?: string },
) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: options?.limit ?? 100,
    offset: options?.offset ?? 0,
    sortBy: options?.sortBy ?? { column: "created_at", order: "desc" },
    search: options?.search,
  })
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Media Asset Metadata (DB operations)
// ---------------------------------------------------------------------------

/**
 * Record a media asset in the media_assets table after upload.
 */
export async function saveMediaAsset(
  supabase: SupabaseClient,
  asset: {
    user_id: string
    bucket_id: BucketId
    storage_path: string
    file_name: string
    mime_type?: string
    file_size?: number
    width?: number
    height?: number
    tags?: string[]
    alt_text?: string
    description?: string
    linked_entity_type?: string
    linked_entity_id?: string
    public_url?: string
    category?: string
    source_model?: string
    generation_prompt?: string
  },
): Promise<MediaAsset> {
  const { data, error } = await supabase
    .from("media_assets")
    .upsert(
      {
        ...asset,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bucket_id,storage_path" },
    )
    .select()
    .single()
  if (error) throw error
  return data as MediaAsset
}

/**
 * Get media assets with optional filters.
 */
export async function getMediaAssets(
  supabase: SupabaseClient,
  filters?: {
    bucket_id?: BucketId
    linked_entity_type?: string
    linked_entity_id?: string
    tags?: string[]
    category?: string
    search?: string
    limit?: number
    offset?: number
  },
): Promise<{ assets: MediaAsset[]; count: number }> {
  let query = supabase
    .from("media_assets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (filters?.bucket_id) query = query.eq("bucket_id", filters.bucket_id)
  if (filters?.linked_entity_type)
    query = query.eq("linked_entity_type", filters.linked_entity_type)
  if (filters?.linked_entity_id)
    query = query.eq("linked_entity_id", filters.linked_entity_id)
  if (filters?.category) query = query.eq("category", filters.category)
  if (filters?.tags?.length) query = query.overlaps("tags", filters.tags)
  if (filters?.search) query = query.ilike("file_name", `%${filters.search}%`)
  if (filters?.limit) query = query.limit(filters.limit)
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1)

  const { data, error, count } = await query
  if (error) throw error
  return { assets: (data ?? []) as MediaAsset[], count: count ?? 0 }
}

/**
 * Delete a media asset (both storage file and metadata row).
 */
export async function deleteMediaAsset(
  supabase: SupabaseClient,
  asset: Pick<MediaAsset, "id" | "bucket_id" | "storage_path">,
) {
  // Delete from storage
  await deleteFile(supabase, asset.bucket_id as BucketId, asset.storage_path)
  // Delete metadata
  const { error } = await supabase.from("media_assets").delete().eq("id", asset.id)
  if (error) throw error
}

/**
 * Update media asset metadata (tags, alt_text, description, linked entity, category, generation fields).
 */
export async function updateMediaAsset(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<
    Pick<
      MediaAsset,
      | "tags"
      | "alt_text"
      | "description"
      | "linked_entity_type"
      | "linked_entity_id"
      | "category"
      | "source_model"
      | "generation_prompt"
    >
  >,
): Promise<MediaAsset> {
  const { data, error } = await supabase
    .from("media_assets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return data as MediaAsset
}
