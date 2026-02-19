"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const BubbleChat = dynamic(
  () => import("flowise-embed-react").then((mod) => mod.BubbleChat),
  { ssr: false }
);

const DEFAULT_DOJO_THEME_LIGHT = {
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
    welcomeMessage:
      "Hi! I can help you with fragrance blending—suggest oils, proportions, and blend ideas.",
    starterPrompts: [
      "Cozy fall blend ideas",
      "Citrus + woody combinations",
      "What blends well with vanilla?",
    ],
  },
};

const DEFAULT_DOJO_THEME_DARK = {
  button: {
    backgroundColor: "hsl(213, 24%, 65%)",
    iconColor: "hsl(222, 47%, 11%)",
    bottom: 20,
    right: 20,
    size: "medium" as const,
    dragAndDrop: true,
  },
  chatWindow: {
    title: "Blending Lab AI",
    titleBackgroundColor: "hsl(213, 24%, 65%)",
    titleTextColor: "hsl(222, 47%, 11%)",
    backgroundColor: "hsl(222, 47%, 11%)",
    botMessage: {
      backgroundColor: "hsl(222, 35%, 16%)",
      textColor: "hsl(213, 24%, 65%)",
    },
    userMessage: {
      backgroundColor: "hsl(213, 24%, 65%)",
      textColor: "hsl(222, 47%, 11%)",
    },
    textInput: {
      backgroundColor: "hsl(222, 35%, 16%)",
      sendButtonColor: "hsl(213, 24%, 65%)",
      placeholder: "Ask about fragrance blending...",
    },
    welcomeMessage:
      "Hi! I can help you with fragrance blending—suggest oils, proportions, and blend ideas.",
    starterPrompts: [
      "Cozy fall blend ideas",
      "Citrus + woody combinations",
      "What blends well with vanilla?",
    ],
  },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DojoFlowiseBubbleProps {
  chatflowId?: string;
  apiHost?: string;
}

export function DojoFlowiseBubble({ chatflowId, apiHost }: DojoFlowiseBubbleProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { data: config } = useSWR<{
    chatflowId?: string;
    apiHost?: string;
    theme?: Record<string, unknown>;
    chatflowConfig?: Record<string, unknown>;
  }>("/api/flowise/embed-config?scope=dojo", fetcher, {
    revalidateOnFocus: false,
  });

  const id = config?.chatflowId ?? chatflowId ?? process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID;
  const host = config?.apiHost ?? apiHost ?? process.env.NEXT_PUBLIC_FLOWISE_HOST;

  const theme = useMemo(() => {
    const baseTheme = isDark ? DEFAULT_DOJO_THEME_DARK : DEFAULT_DOJO_THEME_LIGHT;
    const savedTheme = (config?.theme ?? {}) as Record<string, unknown>;

    // Merge: saved theme overrides base, but we always apply dark/light overrides for chatWindow colors
    const merged = {
      ...baseTheme,
      ...savedTheme,
      button: { ...baseTheme.button, ...(savedTheme.button as object) },
      chatWindow: {
        ...baseTheme.chatWindow,
        ...(savedTheme.chatWindow as object),
        ...(isDark
          ? {
              backgroundColor: "hsl(222, 47%, 11%)",
              botMessage: {
                ...baseTheme.chatWindow.botMessage,
                backgroundColor: "hsl(222, 35%, 16%)",
                textColor: "hsl(213, 24%, 65%)",
              },
              userMessage: {
                ...baseTheme.chatWindow.userMessage,
                backgroundColor: "hsl(213, 24%, 65%)",
                textColor: "hsl(222, 47%, 11%)",
              },
              textInput: {
                ...baseTheme.chatWindow.textInput,
                backgroundColor: "hsl(222, 35%, 16%)",
                sendButtonColor: "hsl(213, 24%, 65%)",
              },
            }
          : {}),
      },
    } as typeof baseTheme;

    const customCSS = (savedTheme.customCSS as string) ?? "";
    const darkOverrides = isDark
      ? `
    .dark flowise-chatbot {
      --flowise-primary: hsl(213, 24%, 65%);
    }
    ${customCSS}
  `
      : customCSS;

    return {
      ...merged,
      customCSS: darkOverrides.trim(),
    };
  }, [config?.theme, isDark]);

  if (!id || !host) {
    return null;
  }

  return (
    <BubbleChat
      chatflowid={id}
      apiHost={host}
      theme={theme}
    />
  );
}
