"use client";

import dynamic from "next/dynamic";

const BubbleChat = dynamic(
  () => import("flowise-embed-react").then((mod) => mod.BubbleChat),
  { ssr: false }
);

const DOJO_THEME = {
  button: {
    backgroundColor: "hsl(215, 19%, 35%)",
    iconColor: "white",
    bottom: 20,
    right: 20,
    size: "medium" as const,
    dragAndDrop: true,
  },
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
  },
  customCSS: `
    .dark flowise-chatbot {
      --flowise-primary: hsl(213, 24%, 65%);
    }
  `,
};

interface DojoFlowiseBubbleProps {
  chatflowId?: string;
  apiHost?: string;
}

export function DojoFlowiseBubble({
  chatflowId,
  apiHost,
}: DojoFlowiseBubbleProps) {
  const id = chatflowId ?? process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID;
  const host = apiHost ?? process.env.NEXT_PUBLIC_FLOWISE_HOST;

  if (!id || !host) {
    return null;
  }

  return (
    <BubbleChat
      chatflowid={id}
      apiHost={host}
      theme={DOJO_THEME}
    />
  );
}
