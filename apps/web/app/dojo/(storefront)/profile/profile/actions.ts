"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const USERNAME_MIN_LENGTH = 3

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string }

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const full_name = formData.has("full_name")
    ? (formData.get("full_name") as string)
    : undefined
  const rawUsername = formData.has("username")
    ? (formData.get("username") as string)
    : undefined
  const website = formData.has("website")
    ? (formData.get("website") as string)
    : undefined
  const avatar_url = formData.has("avatar_url")
    ? (formData.get("avatar_url") as string)
    : undefined
  const display_name = formData.has("display_name")
    ? (formData.get("display_name") as string)
    : undefined
  const handle = formData.has("handle")
    ? (formData.get("handle") as string)
    : undefined
  const bio = formData.has("bio")
    ? (formData.get("bio") as string)
    : undefined
  const default_agent_slug = formData.has("default_agent_slug")
    ? (formData.get("default_agent_slug") as string)
    : undefined
  const default_chatflow_id = formData.has("default_chatflow_id")
    ? (formData.get("default_chatflow_id") as string)
    : undefined

  const username =
    rawUsername != null && String(rawUsername).trim() !== ""
      ? String(rawUsername).trim()
      : rawUsername !== undefined
        ? null
        : undefined

  if (username !== undefined && username !== null && username.length < USERNAME_MIN_LENGTH) {
    return {
      success: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
    }
  }

  const updates: {
    full_name?: string | null
    username?: string | null
    website?: string | null
    avatar_url?: string | null
    display_name?: string | null
    handle?: string | null
    bio?: string | null
    default_chatflow_id?: string | null
    preferences?: Record<string, unknown>
    updated_at: string
  } = {
    updated_at: new Date().toISOString(),
  }
  if (full_name !== undefined) updates.full_name = full_name ?? null
  if (username !== undefined) updates.username = username
  if (website !== undefined) updates.website = website ?? null
  if (avatar_url !== undefined) updates.avatar_url = avatar_url ?? null
  if (display_name !== undefined) updates.display_name = display_name ?? null
  if (handle !== undefined) updates.handle = handle?.trim() || null
  if (bio !== undefined) updates.bio = bio ?? null
  if (default_chatflow_id !== undefined) updates.default_chatflow_id = default_chatflow_id?.trim() || null

  if (default_agent_slug !== undefined) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("preferences")
      .eq("id", user.id)
      .single()
    const prefs = (existing?.preferences as Record<string, unknown>) ?? {}
    updates.preferences = { ...prefs, default_agent_slug: default_agent_slug || "mood_mnky" }
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "This username is already taken." }
    }
    console.error("Profile update error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dojo/profile", "page")
  revalidatePath("/dojo/profile", "page")
  return { success: true }
}
