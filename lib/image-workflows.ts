/**
 * Image generation workflows and their use cases.
 * Use these descriptions to identify workflows in UI, docs, and n8n.
 */

export const IMAGE_WORKFLOWS = {
  /** Studio: Generate fragrance scene images with optional mascot reference. */
  STUDIO_FRAGRANCE_SCENE: {
    id: "studio-fragrance-scene",
    name: "Studio – Fragrance Scene",
    description:
      "Generate bespoke fragrance scene images in the app. Select a fragrance, optionally add a mascot reference for brand consistency, and generate. Images are stored in ai-generations and can be assigned to fragrances in Media Library.",
    endpoints: ["POST /api/images/generate"],
    model: "gpt-image-1.5",
  },

  /** n8n: Batch generate images for fragrance catalog, upload to Supabase, sync to Notion. */
  N8N_BATCH_FRAGRANCE_SCENES: {
    id: "n8n-batch-fragrance-scenes",
    name: "n8n – Batch Fragrance Scenes",
    description:
      "Automated workflow for generating images for multiple fragrances. Trigger via schedule or manual. Calls generate API, receives publicUrl, then optionally updates Notion page image via API. Use for catalog automation when you have many fragrances to image.",
    endpoints: ["POST /api/images/generate", "POST /api/notion/update-image"],
    model: "gpt-image-1.5",
  },

  /** Media Library: Assign existing images to fragrances, sync URL to Notion. */
  MEDIA_ASSIGN_AND_SYNC: {
    id: "media-assign-and-sync",
    name: "Media Library – Assign & Sync",
    description:
      "Assign an existing image (from uploads or generated) to a fragrance in Media Library. Use 'Sync to Notion' to push the image URL to the Notion fragrance page. One-way: app → Notion.",
    endpoints: ["PATCH /api/media/[id]", "POST /api/notion/update-image"],
    model: null,
  },

  /** Upload from URL: Store external images in Supabase (e.g. from n8n or external sources). */
  UPLOAD_FROM_URL: {
    id: "upload-from-url",
    name: "Upload from URL",
    description:
      "Store an image from an external URL into Supabase (ai-generations or other bucket). Used by n8n when the image source is external, or when importing from another system. Requires CDN_API_KEY.",
    endpoints: ["POST /api/images/upload-from-url"],
    model: null,
  },
} as const

export type ImageWorkflowId = keyof typeof IMAGE_WORKFLOWS
