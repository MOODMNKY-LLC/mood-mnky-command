# AI Chat

The MOOD MNKY LABZ AI Chat provides a conversational interface for fragrance oils, formulas, products, and AI image generation.

**Location:** Access via the **MNKY Chat** section in the sidebar (between Data Sources and Studio).

## Implemented Features

### Core Chat

- **Conversation** – Chat container with scroll and content
- **Message** – Message display with text and markdown rendering
- **Prompt Input** – Textarea, attachments, model selector, submit
- **Attachments** – File uploads in the prompt header

### Tools

| Tool | Purpose |
|------|---------|
| `search_formulas` | Search formulas by name or description (Supabase) |
| `search_fragrance_oils` | Search fragrance oils by name, family, or notes (Supabase) |
| `generate_image` | Generate AI fragrance scene images via `/api/images/generate` |
| `web_search` | OpenAI web search (when enabled) – real-time info, regulations, trends |

### Voice

- **Speech Input** – Microphone button in the prompt bar
  - **Chrome/Edge**: Web Speech API (client-side transcription)
  - **Firefox/Safari**: MediaRecorder → POST to `/api/audio/transcribe` → fill textarea

### Model Selector

- **GPT-5** – Agentic workflows, coding, multi-step tasks (400K context, reasoning)
- **GPT-5 Mini** (default) – Cost-efficient, well-defined tasks
- **GPT-5 Nano** – Fastest, lowest cost
- **o3 Mini** – Deep reasoning for complex formula design
- **GPT-4o** – General purpose
- **GPT-4o Mini** – Lightweight fallback

### Reasoning

When using GPT-5, GPT-5 mini, GPT-5 nano, or o3-mini, the model can emit reasoning. A collapsible **"View reasoning"** block appears in assistant messages. Uses `providerOptions.openai.reasoningSummary` and `reasoningEffort` when the model supports it.

### Vision

Attach images via the prompt header (Add photos or files). The model can analyze product photos, formula sheets, or fragrance scene images. Blob URLs are converted to data URLs before sending.

### Web Search

Toggle the globe icon in the prompt bar to enable web search. When enabled, the model can use `openai.tools.webSearch()` for real-time info (e.g. candle safety regulations, fragrance trends). Sources may appear as `source-url` parts in messages.

### Fragrance Blending Guide

The chat guides users through the CandleScience fragrance oil blending workflow:

- **Notes:** Top (citrusy/floral, fade first), Middle (heart, balance), Base (vanilla, woods, musks, linger)
- **Blending basics:** Start with familiar scents; single-note oils are ideal for beginners
- **Blotter strip testing:** Dip, dry 10 sec, fan under nose; take notes on combos and ratios
- **Blending wheel:** Kindred (adjacent) = harmonious; Complementary (opposite) = contrasting

When the user asks about blending or wants a custom scent, the model guides step-by-step, asks clarifying questions (mood, product type, experience level), uses `search_fragrance_oils` and `search_formulas` to fetch real oils, and ends with 1–2 follow-up questions.

### Suggested Prompts

When the chat is empty, clickable prompts appear:

- **Start fragrance blending guide** – Triggers guided blending flow (enables blending mode)
- **Find fragrances for a cozy fall candle** – Uses `search_fragrance_oils`
- **Help me blend a custom scent** – Generic blending kickoff (enables blending mode)
- **Search formulas for vanilla** – Uses `search_formulas`

### Message Feedback

Assistant messages show thumbs up/down buttons for feedback (visual only in MVP; persistence can be added later).

### Streaming blur-fade (Lab and Verse)

When the assistant response is streaming, each markdown block (paragraph, code block, list, etc.) fades in with a soft blur-to-sharp effect for a smooth, modern feel. The effect uses Streamdown’s `BlockComponent` with a `BlurFadeBlock` wrapper (`components/ai-elements/message.tsx`). **Accessibility:** The animation respects `prefers-reduced-motion`; when the user has reduced motion enabled, the blur-fade is disabled or minimal.

---

## Verse AI Chat

The **Verse** (member portal / storefront) has its own AI chat for discovery, fragrances, and products. It is separate from the Labz chat and uses a dedicated system prompt and API.

**Location:** Verse header (chat icon opens a popup) or full page at **/verse/chat**.

### Features

- **Dock** – Verse dock at the bottom of the screen is always visible; it includes Persona (center) and a Chat icon that opens the popup sheet. Admin users also see Lab, Cart, and Store icons.
- **Popup** – Sheet opened from the dock (or via direct link); “Open full chat” links to `/verse/chat`.
- **Full-page chat** – `/verse/chat` with same conversation UI, title “MNKY VERSE Chat — Meet MOOD MNKY”.
- **Auth** – Requires sign-in; unauthenticated users see “Sign in to chat” and a link to `/auth/login`.
- **Empty state** – “Meet MOOD MNKY” with suggestion chips on the full page (e.g. “What fragrances do you have?”, “Tell me about MOOD MNKY”, “Explore fresh scents”).
- **No tools** – Verse chat is text-only (no formula search, image generation, or web search).
- **Streaming blur-fade** – While the assistant reply streams in, each markdown block (paragraph, code block, etc.) fades in with a soft blur-to-sharp effect. Respects `prefers-reduced-motion` (animation disabled or minimal when the user has reduced motion enabled).

### Implementation

- **API:** `POST /api/verse/chat` – streaming, Supabase auth required, `streamText` with `gpt-4o-mini`, no tools.
- **System prompt:** `lib/chat/verse-system-prompt.ts` (MOOD MNKY / SAGE MNKY, member portal, discovery).
- **Components:** `components/verse/chat/` – VerseConversation, VerseMessage, VersePromptInput; Verse styling (verse-text, verse-border, glass-panel).
- **Popup:** `components/verse/verse-chat-popup.tsx`; **full page:** `app/(storefront)/verse/chat/page.tsx` and `verse-chat-page-content.tsx`.

---

## Persona (Rive)

The [Elements AI SDK Persona](https://elements.ai-sdk.dev/components/persona) is a Rive WebGL2 avatar that reflects chat state. It is used in Verse chat (full page and popup), in the Verse dock, and in Lab chat.

- **States:** `idle` | `listening` | `thinking` | `speaking` | `asleep`
- **Mapping:** Derived from `useChat` `status`: `thinking` when `status === 'streaming' || status === 'submitted'`, otherwise `idle`. Optional: `listening` when Speech Input is active; `speaking` when TTS is playing (not wired yet). Verse uses a shared `VersePersonaStateContext` so the dock and fixed Persona stay in sync with the active chat.
- **Variants:** Verse and Lab use the **halo** variant by default. Other variants: `command`, `glint`, `opal`, `mana`, `obsidian`.
- **Verse dock placement:** Persona appears in the **center of the Verse dock** (bottom of screen) and as a **fixed bottom-right** avatar (`fixed bottom-4 right-4`) for consistency and accessibility across the Verse space. Chat is opened from the dock (MessageCircle icon); the header no longer has a Chat link or popup trigger.
- **Location:** `components/ai-elements/persona.tsx` (installed via `npx ai-elements@latest add persona`). Depends on `@rive-app/react-webgl2`; consider dynamic import and a fallback if Rive fails to load.

---

## User-aware memory (Supabase)

Chat sessions and messages are persisted in Supabase so the model can use recent context and conversations can be continued across requests.

- **Tables:** `chat_sessions` (id, user_id, title, created_at, updated_at), `chat_messages` (id, session_id, role, content, created_at). RLS restricts access to `auth.uid() = user_id` (sessions) and to messages whose session belongs to the user.
- **Session ID:** The client sends optional `sessionId` in the request body. The API returns `x-chat-session-id` in the response header; the client stores it and sends it on subsequent requests so messages attach to the same session.
- **Persistence:** On each request, the latest user message is inserted into `chat_messages`; when the assistant stream finishes, the assistant message is persisted via `toUIMessageStreamResponse({ onFinish: ... })`.
- **System prompt injection:** The API loads the last N messages (e.g. 20) for the current session from `chat_messages`, formats them as "User: ... / Assistant: ...", and prepends a "Recent conversation context (for continuity)" section to the system prompt so the model is user- and session-aware.

---

## OpenAI integration options (future)

The current implementation uses the AI SDK `streamText` + `toUIMessageStreamResponse()` and Supabase for persistence. The following can be added in later phases:

- **OpenAI Responses API** – Server-side Conversations and Items, streaming events, structured state. Can be introduced as a parallel route (e.g. `POST /api/chat/responses`) or eventually replace `streamText` for features that need server-held conversation state.
- **OpenAI Realtime API** – Low-latency voice/audio (Realtime Beta). Persona "listening" and "speaking" map naturally when the client sends audio and the model speaks; can be added after Persona and text chat are stable.
- **OpenAI Agents SDK** – Session memory, long-term memory/notes, multi-agent flows. Can run on the server (e.g. dedicated route or background job), with Supabase as the store for long-term notes or vector memory, and the existing chat API calling the agent for memory lookup and injecting results into the system prompt.

---

## API

- **POST `/api/chat`** – Labz streaming chat with tools
  - Body: `{ messages: UIMessage[], model?: string, webSearch?: boolean, mode?: "blending", sessionId?: string }`
  - `mode: "blending"` – Appends blending-specific instructions for step-by-step guidance
  - `sessionId` – Optional; if present, messages are appended to that session; response includes `x-chat-session-id`.
  - Uses `streamText` from AI SDK with OpenAI; persists messages to `chat_sessions` / `chat_messages` and injects last N messages into the system prompt.
  - Allowed models: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `o3-mini`, `gpt-4o`, `gpt-4o-mini`
- **POST `/api/verse/chat`** – Verse streaming chat (no tools, Supabase auth required; uses `gpt-4o-mini`)
  - Body: `{ messages: UIMessage[], sessionId?: string }`
  - Response: `x-chat-session-id` header for client to reuse; messages persisted and last N injected into system prompt.

## Environment Variables

- `OPENAI_API_KEY` – Required for chat and tools
- `NEXT_PUBLIC_APP_URL` – Optional; base URL for internal API calls (e.g. image generation from tools). Defaults to `http://localhost:3000` locally.

## Future Components

| Component | Use Case |
|-----------|----------|
| **Chain of Thought** | Step-by-step reasoning display – implemented; collapsible reasoning block |
| **Checkpoint** | Conversation history / restore points |
| **Confirmation** | Human approval for destructive tools (e.g. delete media) |
| **Context** | Shared context panel (e.g. formula in focus) |
| **Inline Citation** | Inline source refs in markdown |
| **Plan** | Multi-step product build or workflow plans |
| **Queue** | Batch generation queue visualization |
| **Code Block** | Display generated SQL, formulas, or code |
| **Agent Artifact** | Generated PDFs, images as artifacts |
| **Sources** | Web search citations – implemented; source-url parts rendered as links |
| **Audio Player** | TTS "Read aloud" on assistant messages |
| **Voice Selector** | Let user pick TTS voice |
| **Canvas / Workflow** | Visual formula or product builder workflow |

## File Structure

```
app/
  api/
    chat/
      route.ts
  (dashboard)/
    chat/
      page.tsx

components/
  ai-elements/
    conversation.tsx
    message.tsx
    persona.tsx
    prompt-input.tsx
    attachments.tsx
    tool.tsx
    reasoning.tsx
    speech-input.tsx

lib/
  chat/
    tools.ts
    system-prompt.ts
```
