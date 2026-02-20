import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileId = user.id;

  const [questsResult, progressResult] = await Promise.all([
    supabase
      .from("quests")
      .select("id, external_id, title, description, xp_reward, active")
      .eq("active", true)
      .order("title"),
    supabase
      .from("quest_progress")
      .select("quest_id, completed_at")
      .eq("profile_id", profileId),
  ]);

  if (questsResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch quests", details: questsResult.error.message },
      { status: 500 }
    );
  }
  if (progressResult.error) {
    return NextResponse.json(
      {
        error: "Failed to fetch progress",
        details: progressResult.error.message,
      },
      { status: 500 }
    );
  }

  const quests = questsResult.data ?? [];
  const progress = progressResult.data ?? [];
  const completedCount = progress.filter((p) => p.completed_at != null).length;
  const progressByQuest: Record<string, boolean> = {};
  for (const p of progress) {
    progressByQuest[p.quest_id] = p.completed_at != null;
  }

  return NextResponse.json({
    quests,
    progress: progressByQuest,
    completedCount,
    totalActive: quests.length,
  });
}
