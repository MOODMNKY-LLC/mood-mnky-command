# CODE MNKY – MNKY LABZ Virtual Assistant

CODE MNKY is the MNKY LABZ virtual assistant: an in-dashboard conversational assistant for formulas, fragrance oils, glossary, blending, and LABZ Pages. It appears as a dock button and opens in a frosted-glass dialog.

**Location:** Click the CODE MNKY avatar in the **LABZ dock** (bottom of the dashboard sidebar) to open the chat popup.

**Configuration:** Model, system instructions, tools, and integrations are described and configurable from the **CODE MNKY** entry in the **MNKY LABZ** sidebar (under Product Builder). Open **CODE MNKY** to view the control panel. The panel is **editable**: you can set the default chat model (saved to the database) and edit the system prompt (with Save and Reset to default). Config is stored in Supabase (`code_mnky_config`); the chat API uses these overrides when present.

## Features

### Active today

| Feature | Description |
|--------|-------------|
| **Conversation** | Scrollable message list with stick-to-bottom and empty state |
| **Message** | Assistant and user messages with copy action |
| **Prompt Input** | Textarea, submit, and stop while streaming |
| **Attachments** | Add files in the prompt header (inline badges with remove) |
| **Reasoning** | Collapsible “View reasoning” when the model streams reasoning parts |
| **Tool** | Tool calls and results shown with Tool header and input/output |
| **Voice** | Microphone button for speech-to-text (LabzVoiceInput) |
| **Conversation Download** | Export conversation as Markdown (button in top-right when messages exist) |
| **Shimmer** | “Thinking…” loading state while waiting for the first assistant token |
| **Suggestion** | Empty-state prompts: “Ask about formulas”, “Search fragrance oils”, “LABZ Pages summary” (click to send) |
| **Model Selector** | Dropdown in the header to choose the chat model (list from OpenAI Models API or fallback, e.g. GPT-5, o3, o1, GPT-4o family); value is sent in the request body |

### Frosted glass design

The chat dialog uses **theme-aware glassmorphism**: translucent panels (`bg-background/75`, `backdrop-blur-2xl`), subtle borders (`border-border/50`, `dark:border-white/10`), and consistent blur on header and footer so the whole surface feels unified. The conversation area uses `bg-background/55` and `backdrop-blur-md`. Styling follows root design tokens only (see [Design System](../DESIGN-SYSTEM.md)); no Verse-specific tokens.

### Planned / when API supports

| Feature | Notes |
|--------|-------|
| **Sources** | When the LABZ API returns `source-document` or source parts, Sources (and optionally Inline Citation) will be rendered for that message. |
| **Inline Citation** | Same as Sources; wired when citation/source data exists in message parts. |
| **Checkpoint** | Checkpoint/restore or segment data would require API and client state support; documented as future. |
| **Confirmation** | Tool confirmation (accept/reject) requires AI SDK experimental tool confirmation and API support. |

## How to use

1. **Open** – Click the CODE MNKY avatar in the LABZ dock.
2. **Choose model** – Use the dropdown in the header to pick GPT-4o Mini, GPT-4o, or GPT-4o Nano (applies to the next message).
3. **Send messages** – Type in the input and press Enter or click submit.
4. **Attach files** – Use the attachment action in the prompt bar to add files.
5. **Use voice** – Click the microphone; speak (Chrome/Edge use Web Speech API; others use server-side transcription).
6. **Download** – When the conversation has messages, use the download icon (top-right) to export as `labz-conversation.md`.
7. **Suggestions** – When the chat is empty, click a suggestion to send that prompt.

## Extending CODE MNKY

To add tools, change the model, or enable confirmation/checkpoints, extend the LABZ chat API (`app/api/labz/chat/route.ts`) and the tool definitions in `lib/chat/labz-tools.ts`. Default model and system prompt overrides are persisted via `GET/PATCH /api/labz/config` and the `code_mnky_config` table. For the main dashboard AI Chat (MNKY Chat page with model selector and full tools), see [AI Chat](AI-CHAT.md). For the Flowise orchestration panel (list and test flows on the hosted instance), see [Flowise Control Panel](FLOWISE-CONTROL-PANEL.md).
