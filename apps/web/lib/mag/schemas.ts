import { z } from "zod"

export const readEventSchema = z.object({
  issueId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  sessionId: z.string().min(1),
  percentRead: z.number().int().min(0).max(100),
  activeSeconds: z.number().int().min(0),
  completed: z.boolean(),
})

export const downloadEventSchema = z.object({
  issueId: z.string().uuid(),
  downloadType: z.enum(["pdf", "wallpaper_pack", "scent_cards"]),
})

export const quizSubmitSchema = z.object({
  issueId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
})

export type ReadEventInput = z.infer<typeof readEventSchema>
export type DownloadEventInput = z.infer<typeof downloadEventSchema>
export type QuizSubmitInput = z.infer<typeof quizSubmitSchema>
