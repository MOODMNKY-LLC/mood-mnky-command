"use client";

/**
 * Option B: direct client-to-Flowise embed. Use only for public, low-risk chatflows
 * (e.g. marketing bots with no secrets). For Dojo / auth-required chat use
 * DojoFlowiseChatbot + /api/flowise/predict (server-proxy).
 */
import dynamic from "next/dynamic";

const FullPageChat = dynamic(
  () => import("flowise-embed-react").then((mod) => mod.FullPageChat),
  { ssr: false }
);

const DOJO_THEME = {
  chatWindow: {
    title: "Blending Lab AI",
    titleBackgroundColor: "hsl(215, 19%, 35%)",
    titleTextColor: "#ffffff",
    backgroundColor: "hsl(0 0% 100%)",
    botMessage: {
      backgroundColor: "hsl(0 0% 97%)",
      textColor: "hsl(0 0% 20%)",
    },
    userMessage: {
      backgroundColor: "hsl(215, 19%, 35%)",
      textColor: "#ffffff",
    },
    textInput: {
      backgroundColor: "hsl(0 0% 100%)",
      sendButtonColor: "hsl(215, 19%, 35%)",
      placeholder: "Ask about fragrance blending...",
    },
    welcomeMessage: "Hi! I can help you with fragrance blending—suggest oils, proportions, and blend ideas.",
    starterPrompts: [
      "Cozy fall blend ideas",
      "Citrus + woody combinations",
      "What blends well with vanilla?",
    ],
    height: 600,
    width: 400,
  },
};

interface DojoFlowiseFullProps {
  chatflowId?: string;
  apiHost?: string;
  className?: string;
}

export function DojoFlowiseFull({
  chatflowId,
  apiHost,
  className,
}: DojoFlowiseFullProps) {
  const id = chatflowId ?? process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID;
  const host = apiHost ?? process.env.NEXT_PUBLIC_FLOWISE_HOST;

  if (!id || !host) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center text-sm text-muted-foreground">
        Flowise chat unavailable. Set NEXT_PUBLIC_FLOWISE_HOST and
        NEXT_PUBLIC_FLOWISE_CHATFLOW_ID to enable.
      </div>
    );
  }

  return (
    <FullPageChat
      chatflowid={id}
      apiHost={host}
      theme={DOJO_THEME}
      className={className}
    />
  );
}
