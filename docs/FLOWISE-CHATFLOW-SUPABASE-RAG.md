# Adding Supabase RAG to the MOOD MNKY Chatflow

This doc describes how to add Supabase as the vector store (RAG) to the MOOD MNKY Chatflow so the Tool Agent can answer from uploaded documents (e.g. blending guides, glossary, product notes) with per-user filtering.

## Prerequisites

- **Supabase:** App project has `documents` table and `match_documents` function (see [FLOWISE-USER-SUPABASE.md](FLOWISE-USER-SUPABASE.md)). Schema: `content`, `metadata` (jsonb), `embedding` (vector). `match_documents(query_embedding, match_count, filter)` uses `metadata @> filter` so `supabaseMetadataFilter` applies.
- **App behaviour:** The predict route already injects `overrideConfig.supabaseMetadataFilter = { profile_id: user.id }` when not overridden. The document-store upsert proxy injects `metadata.profile_id` on upload. So once the chatflow uses a Supabase-backed store and respects overrideConfig, per-user RAG works.

## Option A: Chatflow with Retriever / Document Store node

Use this when building in the **Chatflow** visual builder.

### 1. Add Supabase Vector Store in Flowise

1. In Flowise, add a **Document Store** (or **Supabase Vector Store**) node.
2. Configure:
   - **Supabase Project URL:** from Supabase project settings.
   - **API Key:** Supabase anon or service role key (credential or env).
   - **Table name:** `documents`.
   - **Query name:** `match_documents`.
   - **Embedding model:** Connect an Embeddings node (e.g. OpenAI Embeddings) that matches your embedding dimension (e.g. 1536 for OpenAI).

### 2. Add a Retriever

1. Add a **Retriever** (or “Load from Document Store”) node that uses the Supabase document store and accepts a query.
2. Wire the Retriever so the **Tool Agent** (or an intermediate prompt) receives retrieved chunks. Common patterns:
   - **Chain:** user message → Retriever (query derived from message) → build context string → inject into a Prompt Template that has a “context” variable → pass augmented prompt into the Tool Agent; or
   - **Subgraph:** Retriever output → inject into a template → Tool Agent gets the prompt with context.

### 3. Respect overrideConfig in the chatflow

- The app sends `overrideConfig.supabaseMetadataFilter = { profile_id: "<user-uuid>" }` on predict. Ensure the chatflow (or the node that performs the Supabase query) passes this filter into the vector store query. In Flowise’s Supabase node, this is typically done via the override key `supabaseMetadataFilter` so that at runtime the store uses `filter = overrideConfig.supabaseMetadataFilter`.
- If you use Flowise-managed document store IDs per user, the app can also send `overrideConfig.documentStoreId`; the app already merges this from `flowise_user_document_stores` when set.

### 4. Describe knowledge in the prompt

In the Tool Agent’s system message (or the prompt that receives RAG context), state that the agent can use the retrieved “knowledge base” or “document store” for blending, glossary, formulas, etc. The MOOD MNKY tool-agent prompt in `apps/web/lib/chat/flowise-tool-agent-prompt.ts` already describes this; keep that when using RAG.

### 5. Optional: Input Moderation

The Tool Agent node in Flowise supports an optional **Input Moderation** anchor. Enabling it lets you filter harmful or off-topic input before it reaches the LLM. Consider adding an Input Moderation node and connecting it to the Tool Agent when deploying the Master Chatflow in production.

## Option B: Agentflow V2

If you use **Agentflow V2** instead of Chatflow:

- The **Agent** node has **Knowledge / Document Stores** and **Knowledge / Vector Embeddings**.
- Add your Supabase vector store there with “Describe Knowledge” and optional “Return Source Documents.”
- The agent can then query the store directly without a separate Retriever chain. Ensure the Flowise Agentflow passes `overrideConfig.supabaseMetadataFilter` into the Supabase store when performing retrieval.

## App-side (already in place)

- **Upload:** `POST /api/flowise/document-store/upsert/[id]` injects `metadata.profile_id = user.id` so chunks are filterable by user.
- **Predict:** `apps/web/app/api/flowise/predict/route.ts` sets `supabaseMetadataFilter: { profile_id: user.id }` in merged overrideConfig unless overridden.
- **Single store:** For one Supabase-backed store and per-user filtering by metadata, you do not need a per-user `documentStoreId`; the same store + filter is enough.

## Security: Postgres Record Manager and exported chatflows

Exported chatflows (e.g. **MOOD MNKY (Master) Chatflow**) may include a **Postgres Record Manager** node for document-store indexing. **Never commit a hardcoded connection string (host with password) in the JSON.** In this repo the Master Chatflow has the Record Manager `host` field left empty.

- **In Flowise:** Configure the Postgres Record Manager using a **Flowise credential** or env-based config in the Flowise UI so the connection string is not stored in the exported chatflow file.
- **After importing:** If you import a chatflow that previously contained a connection string, clear the `host` (or replace with a credential reference) before committing or sharing.

## References

- [FLOWISE-USER-SUPABASE.md](FLOWISE-USER-SUPABASE.md) — Two Supabase roles, document store approaches, schema.
- [Flowise – Supabase vector store](https://docs.flowiseai.com/integrations/langchain/vector-stores/supabase) — Table, `match_documents`, metadata filtering.
- [FLOWISE-MNKY-COMPONENTS.md](FLOWISE-MNKY-COMPONENTS.md) — Override config keys (`documentStoreId`, `supabaseMetadataFilter`, etc.).
