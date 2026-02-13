import { tool } from "ai"
import { z } from "zod"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  calculateBlendProportions,
  calculateWaxForVessel,
  listContainers,
} from "@/lib/chat/blending-calc"

function escapeIlike(q: string): string {
  return q.replace(/%/g, "\\%").replace(/_/g, "\\_")
}


export const searchFormulasTool = tool({
  description:
    "Search formulas by name or description. Use this when the user asks about candle formulas, skincare formulas, or recipe ingredients.",
  inputSchema: z.object({
    query: z.string().describe("Search term for formula name or description"),
    limit: z.number().min(1).max(20).default(5).optional(),
  }),
  execute: async ({ query, limit = 5 }) => {
    const supabase = await createClient()
    const p = escapeIlike(query)
    const { data, error } = await supabase
      .from("formulas")
      .select("id, name, slug, description, category_id")
      .or(`name.ilike.%${p}%,description.ilike.%${p}%`)
      .limit(limit)

    if (error) return { error: error.message, formulas: [] }
    return { formulas: data ?? [] }
  },
})

export const searchFragranceOilsTool = tool({
  description:
    "Search fragrance oils by name, family, or notes. Use when the user asks about specific fragrances, scent families, or oil recommendations.",
  inputSchema: z.object({
    query: z.string().describe("Search term for fragrance name, family, or notes"),
    limit: z.number().min(1).max(20).default(5).optional(),
  }),
  execute: async ({ query, limit = 5 }) => {
    const supabase = await createClient()
    const p = escapeIlike(query)
    const { data, error } = await supabase
      .from("fragrance_oils")
      .select("id, name, family, description, subfamilies, top_notes, middle_notes, base_notes")
      .or(`name.ilike.%${p}%,family.ilike.%${p}%,description.ilike.%${p}%`)
      .limit(limit)

    if (error) return { error: error.message, oils: [] }
    return { oils: data ?? [] }
  },
})

export const generateImageTool = tool({
  description:
    "Generate an AI fragrance scene image from a text prompt. Use when the user wants to create or generate an image for a fragrance, product, or scene.",
  inputSchema: z.object({
    prompt: z.string().describe("Detailed image generation prompt (e.g. 'Cozy cabin with warm candle glow')"),
    fragranceName: z.string().optional().describe("Optional fragrance name for context"),
  }),
  execute: async ({ prompt, fragranceName }) => {
    try {
      const fullPrompt = fragranceName
        ? `${prompt}. Fragrance: ${fragranceName}.`
        : prompt
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        "http://localhost:3000"
      const h = await headers()
      const cookie = h.get("cookie") ?? ""
      const res = await fetch(`${baseUrl}/api/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({
          prompt: fullPrompt,
          fragranceName: fragranceName ?? undefined,
          model: "gpt-image-1.5",
          size: "1024x1024",
          quality: "high",
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return {
          success: false,
          error: (err as { error?: string })?.error ?? res.statusText,
        }
      }
      const { asset, publicUrl } = await res.json()
      return {
        success: true,
        message: "Image generated and saved to media library.",
        assetId: asset?.id,
        publicUrl,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Image generation failed",
      }
    }
  },
})

export const getFragranceOilByIdTool = tool({
  description:
    "Get a single fragrance oil by ID. Use when you need full details for an oil the user selected or when validating oil IDs.",
  inputSchema: z.object({
    oilId: z.string().describe("UUID of the fragrance oil"),
  }),
  execute: async ({ oilId }) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("fragrance_oils")
      .select("id, name, family, description, subfamilies, top_notes, middle_notes, base_notes, max_usage_candle")
      .eq("id", oilId)
      .single()

    if (error) return { error: error.message, oil: null }
    return { oil: data }
  },
})

export const calculateBlendProportionsTool = tool({
  description:
    "Calculate suggested proportions for a blend of fragrance oils. Use when the user has selected oils and wants to know ratios, or when they ask to adjust (e.g. 'more leather, less citrus').",
  inputSchema: z.object({
    oils: z
      .array(
        z.object({
          oilId: z.string().describe("Fragrance oil ID"),
          oilName: z.string().describe("Fragrance oil name"),
        })
      )
      .min(1)
      .max(4)
      .describe("Array of oils to blend"),
    preferences: z
      .string()
      .optional()
      .describe("User preferences e.g. 'more leather, less citrus' or 'sweeter'"),
    productType: z
      .string()
      .default("candle")
      .describe("Product type: candle, soap, lotion, etc."),
  }),
  execute: async ({ oils, preferences, productType }) => {
    const proportions = calculateBlendProportions(oils, preferences, productType)
    const totalPct = proportions.reduce((s, p) => s + p.proportionPct, 0)
    return { proportions, totalPct }
  },
})

export const calculateWaxForVesselTool = tool({
  description:
    "Calculate wax and fragrance amounts for a candle vessel. Use when the user selects a vessel or asks how much wax they need.",
  inputSchema: z.object({
    containerId: z
      .string()
      .optional()
      .describe("Container ID from list_containers (e.g. c-003)"),
    capacityOz: z
      .number()
      .min(1)
      .max(32)
      .optional()
      .describe("Capacity in oz if containerId not provided"),
    fragranceLoadPct: z
      .number()
      .min(5)
      .max(15)
      .default(10)
      .optional()
      .describe("Fragrance load percentage (default 10%)"),
  }),
  execute: async ({ containerId, capacityOz, fragranceLoadPct = 10 }) => {
    const result = calculateWaxForVessel(containerId, capacityOz, fragranceLoadPct)
    if (!result) {
      return {
        error: "Container not found. Use list_containers to see available options.",
      }
    }
    return result
  },
})

export const listContainersTool = tool({
  description:
    "List available candle vessels/containers. Use when the user wants to pick a vessel or see options.",
  inputSchema: z.object({
    capacityOz: z
      .number()
      .optional()
      .describe("Filter by capacity (e.g. 8 for 8oz vessels)"),
  }),
  execute: async ({ capacityOz }) => {
    const containers = listContainers(capacityOz)
    return {
      containers: containers.map((c) => ({
        id: c.id,
        name: c.name,
        capacityOz: c.capacityOz,
        material: c.material,
      })),
    }
  },
})

export const saveCustomBlendTool = tool({
  description:
    "Save a custom fragrance blend for the user. Use when they confirm they are satisfied with their blend and want to save it. Include a descriptive name and notes.",
  inputSchema: z.object({
    name: z.string().describe("Descriptive name for the blend"),
    productType: z.string().describe("Product type: candle, soap, etc."),
    fragrances: z
      .array(
        z.object({
          oilId: z.string(),
          oilName: z.string(),
          proportionPct: z.number().min(0).max(100),
        })
      )
      .min(1)
      .max(4)
      .describe("Oils and proportions"),
    batchWeightG: z.number().min(50).max(5000).optional(),
    fragranceLoadPct: z.number().min(5).max(15).default(10).optional(),
    notes: z.string().optional().describe("Tags, descriptors, or replication notes"),
  }),
  execute: async ({
    name,
    productType,
    fragrances,
    batchWeightG,
    fragranceLoadPct = 10,
    notes,
  }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const totalPct = fragrances.reduce((s, f) => s + f.proportionPct, 0)
    if (Math.abs(totalPct - 100) > 1) {
      return { success: false, error: "Proportions must sum to 100%" }
    }

    // Schema requires batch_weight_g and fragrance_load_pct; use defaults when not provided
    const effectiveBatchWeight = batchWeightG ?? 400
    const { data, error } = await supabase
      .from("saved_blends")
      .insert({
        user_id: user.id,
        name,
        product_type: productType,
        batch_weight_g: effectiveBatchWeight,
        fragrance_load_pct: fragranceLoadPct,
        fragrances,
        notes: notes ?? null,
      })
      .select("id")
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, blendId: data?.id }
  },
})

export const listSavedBlendsTool = tool({
  description:
    "List the user's saved custom blends. Use when they ask to see their saved blends or load a previous blend.",
  inputSchema: z.object({}),
  execute: async () => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { blends: [], error: "Not authenticated" }
    }

    const { data, error } = await supabase
      .from("saved_blends")
      .select("id, name, product_type, fragrances, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return { blends: [], error: error.message }
    return { blends: data ?? [] }
  },
})

export const getSavedBlendTool = tool({
  description:
    "Get a single saved blend by ID. Use when the user wants to use or replicate a saved blend.",
  inputSchema: z.object({
    blendId: z.string().uuid().describe("Saved blend ID"),
  }),
  execute: async ({ blendId }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated", blend: null }
    }

    const { data, error } = await supabase
      .from("saved_blends")
      .select("*")
      .eq("id", blendId)
      .eq("user_id", user.id)
      .single()

    if (error) return { error: error.message, blend: null }
    return { blend: data }
  },
})

export const getLatestFunnelSubmissionTool = tool({
  description:
    "Get the user's latest fragrance intake funnel submission. Use when the user has completed a JotForm intake and you want to personalize recommendations (mood, product type, notes, blend style). Returns structured answers from their most recent submission.",
  inputSchema: z.object({
    funnelId: z
      .string()
      .uuid()
      .optional()
      .describe("Funnel definition ID. If omitted, uses the most recent submitted run from any funnel."),
  }),
  execute: async ({ funnelId }) => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Not authenticated", submission: null }
    }

    let runQuery = supabase
      .from("funnel_runs")
      .select("id, funnel_id, submitted_at")
      .eq("user_id", user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(1)

    if (funnelId) {
      runQuery = runQuery.eq("funnel_id", funnelId)
    }

    const { data: run, error: runError } = await runQuery.maybeSingle()

    if (runError || !run) {
      return { submission: null, message: "No funnel submission found" }
    }

    const { data: answers, error: answersError } = await supabase
      .from("funnel_answers")
      .select("question_key, answer")
      .eq("run_id", run.id)

    if (answersError) {
      return { error: answersError.message, submission: null }
    }

    const answersMap = (answers ?? []).reduce(
      (acc, { question_key, answer }) => {
        acc[question_key] = (answer as { text?: string })?.text ?? answer
        return acc
      },
      {} as Record<string, unknown>
    )

    let mappedAnswers: Record<string, unknown> | undefined
    const { data: funnel } = await supabase
      .from("funnel_definitions")
      .select("question_mapping")
      .eq("id", run.funnel_id)
      .single()

    const mapping = (funnel?.question_mapping ?? {}) as Record<string, string>
    if (Object.keys(mapping).length > 0) {
      mappedAnswers = {}
      for (const [semanticKey, qKey] of Object.entries(mapping)) {
        const val = answersMap[qKey]
        if (val !== undefined && val !== null && val !== "") {
          mappedAnswers[semanticKey] = val
        }
      }
    }

    return {
      submission: {
        runId: run.id,
        submittedAt: run.submitted_at,
        answers: answersMap,
        mappedAnswers,
      },
    }
  },
})

export const chatTools = {
  search_formulas: searchFormulasTool,
  search_fragrance_oils: searchFragranceOilsTool,
  generate_image: generateImageTool,
  get_fragrance_oil_by_id: getFragranceOilByIdTool,
  calculate_blend_proportions: calculateBlendProportionsTool,
  calculate_wax_for_vessel: calculateWaxForVesselTool,
  list_containers: listContainersTool,
  save_custom_blend: saveCustomBlendTool,
  list_saved_blends: listSavedBlendsTool,
  get_saved_blend: getSavedBlendTool,
  get_latest_funnel_submission: getLatestFunnelSubmissionTool,
}
