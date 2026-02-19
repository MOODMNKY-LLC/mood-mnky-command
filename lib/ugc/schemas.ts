import { z } from "zod"

export const ugcPresignSchema = z.object({
  mediaType: z.string().regex(/^image\/(jpeg|png|webp|gif)$|^video\/(mp4|webm)$/),
  bytes: z.number().int().positive().optional(),
  filename: z.string().max(256).optional(),
})

export const ugcSubmitSchema = z.object({
  collectionId: z.string().uuid().optional().nullable(),
  type: z.enum(["photo", "video", "story"]),
  caption: z.string().max(2000).optional(),
  mediaPath: z.string().min(1),
  mediaHash: z.string().min(1),
})

export type UgcPresignInput = z.infer<typeof ugcPresignSchema>
export type UgcSubmitInput = z.infer<typeof ugcSubmitSchema>
