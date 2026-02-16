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

## API

- **POST `/api/chat`** – Streaming chat with tools
  - Body: `{ messages: UIMessage[], model?: string, webSearch?: boolean, mode?: "blending" }`
  - `mode: "blending"` – Appends blending-specific instructions for step-by-step guidance
  - Uses `streamText` from AI SDK with OpenAI
  - Allowed models: `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `o3-mini`, `gpt-4o`, `gpt-4o-mini`

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
