"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createStreamSession(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const overlay_token = crypto.randomUUID();
  const { error } = await supabase.from("stream_sessions").insert({
    profile_id: user.id,
    name: name || "Stream session",
    overlay_token,
    source: "act_ingest",
    started_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/live");
  return { ok: true, overlay_token };
}

export async function deleteStreamSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("stream_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/live");
  return { ok: true };
}
