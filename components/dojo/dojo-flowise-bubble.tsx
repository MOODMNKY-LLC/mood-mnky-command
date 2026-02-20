"use client";

import dynamic from "next/dynamic";
import useSWR from "swr";
import { useTheme } from "next-themes";
import { useMemo } from "react";

const BubbleChat = dynamic(
  () => import("flowise-embed-react").then((mod) => mod.BubbleChat),
  { ssr: false }
);

/* Dojo dashboard palette: dark greys + primary blue-grey accent */
const DOJO_PRIMARY_LIGHT = "hsl(215, 19%, 35%)";
const DOJO_PRIMARY_DARK = "hsl(213, 24%, 65%)";
const DOJO_BG_DARK = "hsl(0, 0%, 10%)"; /* #1a1a1a main background */
const DOJO_PANEL_DARK = "hsl(0, 0%, 15%)"; /* #262626 card/panel */
const DOJO_PANEL_DARK_ALT = "hsl(0, 0%, 17%)"; /* #2c2c2c */
const DOJO_TEXT_PRIMARY = "hsl(0, 0%, 100%)";
const DOJO_TEXT_SECONDARY = "hsl(0, 0%, 63%)"; /* #a0a0a0 */
const DOJO_TEXT_MUTED = "hsl(0, 0%, 69%)"; /* #b0b0b0 */

/** Branded asset: mood-mnky-3d (MNKY CHAT avatar, title, chat button). */
const DOJO_MNKY_AVATAR = "/verse/mood-mnky-3d.png";
const DEFAULT_AVATAR_USER =
  "https://raw.githubusercontent.com/zahidkhawaja/langchain-chat-nextjs/main/public/usericon.png";

const DEFAULT_DOJO_THEME_LIGHT = {
  button: {
    backgroundColor: DOJO_PRIMARY_LIGHT,
    iconColor: "white",
    bottom: 20,
    right: 20,
    size: 48 as const,
    dragAndDrop: true,
    customIconSrc: DOJO_MNKY_AVATAR,
    autoWindowOpen: {
      autoOpen: true,
      openDelay: 2,
      autoOpenOnMobile: false,
    },
  },
  tooltip: {
    showTooltip: true,
    tooltipMessage: "Hi there — ask me about blending!",
    tooltipBackgroundColor: "hsl(0 0% 15%)",
    tooltipTextColor: "white",
    tooltipFontSize: 16,
  },
  disclaimer: {
    title: "Disclaimer",
    message:
      'By using this chatbot, you agree to the <a target="_blank" href="https://flowiseai.com/terms">Terms & Conditions</a>.',
    textColor: "hsl(0 0% 20%)",
    buttonColor: DOJO_PRIMARY_LIGHT,
    buttonText: "Start Chatting",
    buttonTextColor: "white",
    blurredBackgroundColor: "rgba(0, 0, 0, 0.4)",
    backgroundColor: "white",
    denyButtonText: "Cancel",
    denyButtonBgColor: "#ef4444",
  },
  form: {
    backgroundColor: "white",
    textColor: "hsl(0 0% 20%)",
  },
  chatWindow: {
    showTitle: true,
    showAgentMessages: true,
    title: "MNKY CHAT",
    titleAvatarSrc: DOJO_MNKY_AVATAR,
    titleBackgroundColor: DOJO_PRIMARY_LIGHT,
    titleTextColor: "#ffffff",
    welcomeMessage:
      "Hi! I can help you with fragrance blending—suggest oils, proportions, and blend ideas.",
    errorMessage: "Something went wrong. Please try again.",
    backgroundColor: "hsl(0 0% 100%)",
    height: 700,
    width: 400,
    fontSize: 16,
    starterPrompts: [
      "Cozy fall blend ideas",
      "Citrus + woody combinations",
      "What blends well with vanilla?",
    ],
    starterPromptFontSize: 15,
    clearChatOnReload: false,
    sourceDocsTitle: "Sources:",
    renderHTML: true,
    botMessage: {
      backgroundColor: "hsl(0 0% 97%)",
      textColor: "hsl(0 0% 20%)",
      showAvatar: true,
      avatarSrc: DOJO_MNKY_AVATAR,
    },
    userMessage: {
      backgroundColor: DOJO_PRIMARY_LIGHT,
      textColor: "#ffffff",
      showAvatar: true,
      avatarSrc: DEFAULT_AVATAR_USER,
    },
    textInput: {
      placeholder: "Ask about fragrance blending...",
      backgroundColor: "hsl(0 0% 100%)",
      textColor: "hsl(0 0% 20%)",
      sendButtonColor: DOJO_PRIMARY_LIGHT,
      maxChars: 500,
      maxCharsWarningMessage: "Please keep your message under 500 characters.",
      autoFocus: true,
      sendMessageSound: true,
      receiveMessageSound: true,
    },
    feedback: {
      color: "hsl(0 0% 20%)",
    },
    dateTimeToggle: {
      date: true,
      time: true,
    },
    footer: {
      textColor: "hsl(0 0% 45%)",
      text: "Powered by",
      company: "MOODMNKY-LLC",
      companyLink: "https://moodmnky.com",
    },
  },
};

const DEFAULT_DOJO_THEME_DARK = {
  button: {
    backgroundColor: DOJO_PRIMARY_DARK,
    iconColor: DOJO_BG_DARK,
    bottom: 20,
    right: 20,
    size: 48 as const,
    dragAndDrop: true,
    customIconSrc: DOJO_MNKY_AVATAR,
    autoWindowOpen: {
      autoOpen: true,
      openDelay: 2,
      autoOpenOnMobile: false,
    },
  },
  tooltip: {
    showTooltip: true,
    tooltipMessage: "Hi there — ask me about blending!",
    tooltipBackgroundColor: DOJO_PANEL_DARK_ALT,
    tooltipTextColor: DOJO_PRIMARY_DARK,
    tooltipFontSize: 16,
  },
  disclaimer: {
    title: "Disclaimer",
    message:
      'By using this chatbot, you agree to the <a target="_blank" href="https://flowiseai.com/terms">Terms & Conditions</a>.',
    textColor: DOJO_TEXT_PRIMARY,
    buttonColor: DOJO_PRIMARY_DARK,
    buttonText: "Start Chatting",
    buttonTextColor: DOJO_BG_DARK,
    blurredBackgroundColor: "rgba(0, 0, 0, 0.6)",
    backgroundColor: DOJO_BG_DARK,
    denyButtonText: "Cancel",
    denyButtonBgColor: "#ef4444",
  },
  form: {
    backgroundColor: DOJO_PANEL_DARK,
    textColor: DOJO_TEXT_PRIMARY,
  },
  chatWindow: {
    showTitle: true,
    showAgentMessages: true,
    title: "MNKY CHAT",
    titleAvatarSrc: DOJO_MNKY_AVATAR,
    titleBackgroundColor: DOJO_PRIMARY_DARK,
    titleTextColor: DOJO_BG_DARK,
    welcomeMessage:
      "Hi! I can help you with fragrance blending—suggest oils, proportions, and blend ideas.",
    errorMessage: "Something went wrong. Please try again.",
    backgroundColor: DOJO_BG_DARK,
    height: 700,
    width: 400,
    fontSize: 16,
    starterPrompts: [
      "Cozy fall blend ideas",
      "Citrus + woody combinations",
      "What blends well with vanilla?",
    ],
    starterPromptFontSize: 15,
    clearChatOnReload: false,
    sourceDocsTitle: "Sources:",
    renderHTML: true,
    botMessage: {
      backgroundColor: DOJO_PANEL_DARK,
      textColor: DOJO_TEXT_PRIMARY,
      showAvatar: true,
      avatarSrc: DOJO_MNKY_AVATAR,
    },
    userMessage: {
      backgroundColor: DOJO_PRIMARY_DARK,
      textColor: DOJO_BG_DARK,
      showAvatar: true,
      avatarSrc: DEFAULT_AVATAR_USER,
    },
    textInput: {
      placeholder: "Ask about fragrance blending...",
      backgroundColor: DOJO_PANEL_DARK_ALT,
      textColor: DOJO_TEXT_PRIMARY,
      sendButtonColor: DOJO_PRIMARY_DARK,
      maxChars: 500,
      maxCharsWarningMessage: "Please keep your message under 500 characters.",
      autoFocus: true,
      sendMessageSound: true,
      receiveMessageSound: true,
    },
    feedback: {
      color: DOJO_TEXT_SECONDARY,
    },
    dateTimeToggle: {
      date: true,
      time: true,
    },
    footer: {
      textColor: DOJO_TEXT_SECONDARY,
      text: "Powered by",
      company: "MOODMNKY-LLC",
      companyLink: "https://moodmnky.com",
    },
  },
};

const embedConfigFetcher = async (url: string) => {
  try {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok) return {};
    const data = await r.json().catch(() => ({}));
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
};

/** Optional observers for parent (e.g. analytics). Passed through to Flowise embed. */
export interface DojoFlowiseObserversConfig {
  observeUserInput?: (userInput: string) => void;
  observeMessages?: (messages: unknown) => void;
  observeLoading?: (loading: boolean) => void;
}

interface DojoFlowiseBubbleProps {
  chatflowId?: string;
  apiHost?: string;
  observersConfig?: DojoFlowiseObserversConfig;
}

export function DojoFlowiseBubble({
  chatflowId,
  apiHost,
  observersConfig,
}: DojoFlowiseBubbleProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { data: config } = useSWR<{
    chatflowId?: string;
    apiHost?: string;
    theme?: Record<string, unknown>;
    chatflowConfig?: Record<string, unknown>;
  }>("/api/flowise/embed-config?scope=dojo", embedConfigFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
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
      tooltip: { ...baseTheme.tooltip, ...(savedTheme.tooltip as object) },
      disclaimer: { ...baseTheme.disclaimer, ...(savedTheme.disclaimer as object) },
      form: { ...baseTheme.form, ...(savedTheme.form as object) },
      chatWindow: {
        ...baseTheme.chatWindow,
        ...(savedTheme.chatWindow as object),
        ...(isDark
          ? {
              backgroundColor: DOJO_BG_DARK,
              botMessage: {
                ...baseTheme.chatWindow.botMessage,
                backgroundColor: DOJO_PANEL_DARK,
                textColor: DOJO_PRIMARY_DARK,
              },
              userMessage: {
                ...baseTheme.chatWindow.userMessage,
                backgroundColor: DOJO_PRIMARY_DARK,
                textColor: DOJO_BG_DARK,
              },
              textInput: {
                ...baseTheme.chatWindow.textInput,
                backgroundColor: DOJO_PANEL_DARK,
                sendButtonColor: DOJO_PRIMARY_DARK,
              },
            }
          : {}),
      },
    } as typeof baseTheme;

    const savedCustomCSS = (savedTheme.customCSS as string) ?? "";
    const glassCSS = isDark
      ? `
      flowise-chatbot {
        --flowise-primary: hsl(213, 24%, 65%);
      }
      flowise-chatbot .bubble-window,
      flowise-chatbot [class*="window"],
      flowise-chatbot [class*="chat-container"] {
        background: rgba(26, 26, 26, 0.94) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
        border-radius: 1rem !important;
      }
    `
      : `
      flowise-chatbot .bubble-window,
      flowise-chatbot [class*="window"],
      flowise-chatbot [class*="chat-container"] {
        background: rgba(241, 245, 249, 0.92) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(15, 23, 42, 0.12) !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1) !important;
        border-radius: 1rem !important;
      }
    `;
    const customCSS = `${glassCSS}\n${savedCustomCSS}`.trim();

    return {
      ...merged,
      customCSS,
    };
  }, [config?.theme, isDark]);

  if (!id || !host) {
    return null;
  }

  const effectiveObservers =
    observersConfig &&
    (observersConfig.observeUserInput ||
      observersConfig.observeMessages ||
      observersConfig.observeLoading)
      ? {
          observeUserInput: observersConfig.observeUserInput ?? (() => {}),
          observeMessages: observersConfig.observeMessages ?? (() => {}),
          observeLoading: observersConfig.observeLoading ?? (() => {}),
        }
      : undefined;

  return (
    <BubbleChat
      chatflowid={id}
      apiHost={host}
      theme={theme}
      chatflowConfig={config?.chatflowConfig}
      observersConfig={effectiveObservers}
    />
  );
}
