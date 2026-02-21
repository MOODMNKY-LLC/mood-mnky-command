# Flowise-MNKY Component Library

Custom components for Flowise integration in the MOOD MNKY app ecosystem.

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

The predict route automatically merges:

1. Assignment `override_config` from `flowise_chatflow_assignments`
2. User's `documentStoreId` from `flowise_user_document_stores` (scope=dojo)
3. `supabaseMetadataFilter: { profile_id }` when not explicitly set
4. Request body `overrideConfig`

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

## Related Files

- [apps/web/components/flowise-mnky/](apps/web/components/flowise-mnky/)
- [apps/web/app/api/flowise/predict/route.ts](apps/web/app/api/flowise/predict/route.ts)
- `apps/web/app/api/flowise/document-store/upsert/[id]/route.ts`
- [docs/FLOWISE-USER-SUPABASE.md](docs/FLOWISE-USER-SUPABASE.md)
