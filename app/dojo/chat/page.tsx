import { DojoFlowiseChatbot } from "@/components/dojo/dojo-flowise-chatbot";

export default async function DojoChatPage({
  searchParams,
}: {
  searchParams: Promise<{ chatflowId?: string }>;
}) {
  const params = await searchParams;
  const chatflowId = typeof params.chatflowId === "string" ? params.chatflowId : undefined;
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4">
      <DojoFlowiseChatbot chatflowId={chatflowId} className="h-full min-h-[360px] flex-1" />
    </div>
  );
}
