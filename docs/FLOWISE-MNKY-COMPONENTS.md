# Flowise-MNKY Component Library

Custom components for Flowise integration in the MOOD MNKY app ecosystem.

## Production pattern

- **Client**: UI and streaming consumption only. Sends messages to *your* API (e.g. `POST /api/flowise/predict` or `POST /api/chat/flowise`). No Flowise base URL or API key in the browser.
- **Server**: All Flowise calls, secrets, auth, rate limiting, and optional audit logging. The predict handler normalizes SSE and enforces input limits.
- **When to use which**:
  - **Server-proxy** (DojoFlowiseChatbot + `/api/flowise/predict` or `/api/chat/flowise`): Use for any flow with auth, private tools, RAG, or user-specific data.
  - **Direct embed** (DojoFlowiseFull with `flowise-embed-react`): Use only for public, low-risk chatflows (e.g. marketing bots with no secrets).

## Overview

The `flowise-mnky` components provide:

- **FlowiseChatflowControlPanel** — Main Dojo config: chatflow selector, override config editor, document store upload
- **FlowiseOverrideConfigEditor** — Dynamic override config UI (documentStoreId, supabaseMetadataFilter, vars, topK, systemMessage)
- **FlowiseDocumentUpload** — Drag-drop upload with metadata injection (profile_id)
- **FlowiseStoreSelector** — Document store picker
- **FlowiseChatUI** — Wrapper around DojoFlowiseChatbot (Elements AI SDK: Conversation, Message, PromptInput, Tool, Reasoning)
- **FlowiseAgentCard** — Chatflow/agent summary card for Dojo
- **FlowisePreview** — Live preview of chatflow output using Elements WebPreview (when tools return URLs or `previewUrl` stream event)
- **FlowisePlan** — AI-generated execution plans from Flowise agents (when tools return plan steps or `plan` stream event)

## Design Sources

- **shadcn** — Card, Tabs, Form, Input, Select, Button, Label
- **Magic UI** — Optional polish for high-impact UI
- **21st.dev Magic** — Optional for net-new components
- **Elements AI SDK** — Agent, Message, Conversation, PromptInput, Tool, Reasoning, Attachments, WebPreview, Plan

## Override Config

Flowise predict supports `overrideConfig` for runtime overrides. Key keys:

| Key | Purpose |
|-----|---------|
| `documentStoreId` | Explicit Flowise document store UUID (from flowise_user_document_stores) |
| `supabaseMetadataFilter` | `{ profile_id: "<uuid>" }` for per-user RAG when using Supabase vector store |
| `vars` | Flowise variables (e.g. moodMnkyApiKey) |
| `topK` | Retrieval count for RAG |
| `systemMessage` | Override system prompt |
| `returnSourceDocuments` | Include source docs in response |
| `autoPlayReadAloud` | When `true`, Dojo automatically starts read-aloud (TTS) for the assistant message when the response finishes (streaming or non-streaming). Set in LABZ → Platform → Flowise → Embed Config. |

The predict route automatically merges:

1. Assignment `override_config` from `flowise_chatflow_assignments`
2. User's `documentStoreId` from `flowise_user_document_stores` (scope=dojo)
3. `supabaseMetadataFilter: { profile_id }` when not explicitly set
4. Request body `overrideConfig`

Embed config (Dojo scope) is loaded from `GET /api/flowise/embed-config?scope=dojo`. Its `chatflowConfig` is merged into the request as above. The **Auto-play read-aloud when assistant message completes** switch in LABZ → Platform → Flowise → Embed Config sets `chatflowConfig.autoPlayReadAloud`; when `true`, Dojo starts TTS for the latest assistant message as soon as the stream (or non-streaming response) completes.

## Document Store and Metadata

When uploading via `/api/flowise/document-store/upsert/[id]`, the proxy injects `metadata: { profile_id: user.id }` into the FormData. This ensures chunks in Supabase `documents` table have `metadata->>'profile_id'` for filtering via `match_documents(filter)`.

## FlowisePreview (WebPreview)

When Flowise tools return URLs (e.g. web scrape, generated page) or the chatflow sends a `previewUrl` stream event, `DojoFlowiseChatbot` renders `FlowisePreview` below the assistant message. Uses Elements `WebPreview` for iframe-based live preview.

```tsx
import { FlowisePreview } from "@/components/flowise-mnky";

<FlowisePreview url="https://example.com" showNavigation />
```

## FlowisePlan (Plan)

When Flowise agent tools return structured plan data (e.g. `{ output: { steps: [{ title, description, content }] } }`) or the chatflow sends a `plan` stream event, `DojoFlowiseChatbot` renders `FlowisePlan` below the assistant message. Uses Elements `Plan` for collapsible step-by-step display.

```tsx
import { FlowisePlan } from "@/components/flowise-mnky";

<FlowisePlan
  title="Execution plan"
  steps={[
    { title: "Step 1", description: "Gather requirements" },
    { title: "Step 2", description: "Implement", content: "Details..." },
  ]}
  isStreaming={false}
/>
```

## Usage

```tsx
import { FlowiseChatflowControlPanel, FlowiseChatUI } from "@/components/flowise-mnky";

// Dojo config page
<FlowiseChatflowControlPanel />

// Chat page
<FlowiseChatUI chatflowId="..." overrideConfig={{ ... }} />
```

## API routes

- **POST /api/flowise/predict** — Main predict endpoint; rate-limited, input limits, SSE normalization, optional audit to `flowise_chat_logs`.
- **POST /api/chat/flowise** — Alias for predict; same body and response. Recommended "chat" namespace for new clients; predict remains for backward compatibility.
- Document store, assignments, feedback, etc.: see [apps/web/app/api/flowise/](apps/web/app/api/flowise/).

## Related Files

- [apps/web/components/flowise-mnky/](apps/web/components/flowise-mnky/)
- [apps/web/app/api/flowise/predict/route.ts](apps/web/app/api/flowise/predict/route.ts)
- [apps/web/app/api/chat/flowise/route.ts](apps/web/app/api/chat/flowise/route.ts)
- [apps/web/lib/flowise/predict-handler.ts](apps/web/lib/flowise/predict-handler.ts)
- `apps/web/app/api/flowise/document-store/upsert/[id]/route.ts`
- [docs/FLOWISE-USER-SUPABASE.md](docs/FLOWISE-USER-SUPABASE.md)
