import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin";
import { DojoFlowiseChatbotLazy } from "@/components/dojo/dojo-flowise-chatbot-lazy";

export default async function DojoChatPage({
  searchParams,
}: {
  searchParams: Promise<{ chatflowId?: string }>;
}) {
  const params = await searchParams;
  let chatflowId = typeof params.chatflowId === "string" ? params.chatflowId : undefined;

  if (!chatflowId && !getSupabaseConfigMissing()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      const [profileRes, assignmentRes] = await Promise.all([
        admin
          .from("profiles")
          .select("default_chatflow_id")
          .eq("id", user.id)
          .maybeSingle(),
        admin
          .from("flowise_chatflow_assignments")
          .select("chatflow_id")
          .eq("profile_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const defaultId = (profileRes.data?.default_chatflow_id as string | null)?.trim();
      const firstAssignmentId = (assignmentRes.data?.chatflow_id as string | null)?.trim();
      chatflowId = defaultId || firstAssignmentId || undefined;
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4">
      <DojoFlowiseChatbotLazy chatflowId={chatflowId} className="h-full min-h-[360px] flex-1" />
    </div>
  );
}
