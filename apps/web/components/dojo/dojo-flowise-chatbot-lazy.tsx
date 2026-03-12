"use client";

import dynamic from "next/dynamic";
import type { DojoFlowiseChatbotProps } from "./dojo-flowise-chatbot";

const DojoFlowiseChatbot = dynamic(
  () =>
    import("./dojo-flowise-chatbot").then((m) => ({
      default: m.DojoFlowiseChatbot,
    })),
  { ssr: false }
);

export function DojoFlowiseChatbotLazy(props: DojoFlowiseChatbotProps) {
  return <DojoFlowiseChatbot {...props} />;
}
