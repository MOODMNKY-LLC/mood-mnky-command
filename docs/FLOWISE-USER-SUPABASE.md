# Flowise and Supabase User Integration

This doc describes how the app links users to Flowise (chatflows, document stores) using Supabase, the roles Supabase plays, connection types, and how to validate or extend the setup.

## Validation (Supabase plugin)

Verified with Supabase MCP (`list_tables`, `execute_sql`) against the project:

- **Tables**: `flowise_embed_config`, `flowise_chatflow_assignments`, `profiles`, `documents` exist in `public`.
- **Columns**: `documents` has `content`, `metadata` (jsonb), `embedding` (vector); `profiles` has `flowise_api_key_encrypted`, `flowise_api_key_verified_at`; assignment and embed config tables have expected columns.
- **Function**: `match_documents` exists in `public` (for Supabase vector store usage).

To re-run validation: use `list_tables` with `project_id` and `schemas: ["public"]`, and `execute_sql` to check `information_schema.columns` and `information_schema.routines` for the above.

---

## Two Supabase roles

| Role | Purpose | Connection / usage |
|------|---------|--------------------|
| **App database** | Auth, profiles, flowise_embed_config, flowise_chatflow_assignments, app data | Existing Supabase client; migrations in repo. |
| **Vector store for RAG** | Embeddings for Flowise document stores (optional) | In Flowise UI: Supabase node with Project URL, API Key, table `documents`, query `match_documents`. Use override: `supabaseMetadataFilter: { profile_id: "<uuid>" }` for per-user docs. |
| **Flowise internal DB** (optional) | Store Flowise chatflows, credentials, document store metadata on Postgres | Flowise env: `DATABASE_TYPE=postgres`, `DATABASE_HOST=db.<ref>.supabase.co`, `DATABASE_PORT=5432`, `DATABASE_NAME=postgres`, `DATABASE_USER=postgres`, `DATABASE_PASSWORD=...`, `DATABASE_SSL=true`. Prefer a **separate** Supabase project or dedicated DB to avoid table/schema collision with the app. |

**Connection type for Flowise backend**: Use **direct Postgres** (port 5432). Supabase pooler (6543) is for serverless; Flowise is long-lived. If using the same project as the app, use a dedicated schema for Flowise if supported, or a second Supabase project.

---

## User management schema (current)

- **flowise_chatflow_assignments**: `profile_id`, `chatflow_id`, `override_config`; admin insert/delete, users select/update own.
- **flowise_embed_config**: scope (e.g. `dojo`) → `chatflow_id`, `api_host`, `theme`, `chatflow_config`.
- **profiles**: `flowise_api_key_encrypted`, `flowise_api_key_verified_at`, `default_chatflow_id` (optional). Dojo chat resolves chatflow in order: URL `chatflowId` → profile `default_chatflow_id` → first assignment → embed config.

Optional table for explicit per-user document stores:

- **flowise_user_document_stores**: `profile_id`, `flowise_store_id`, `display_name`, `scope`; records which Flowise document store is assigned to which user. See migration and API below.

---

## Linking users to document stores (two approaches)

### 1. Explicit stores (Flowise-managed)

- Create or assign a Flowise document store per user (or per scope per user).
- Store the mapping in `flowise_user_document_stores`.
- App proxy: resolve `flowise_store_id` from that table for uploads and pass it in predict override (e.g. document store ID in the chatflow’s Retriever/Document Store node config).
- Flowise API: POST `/document-store/store` with `{ name, description }`; or upsert with `createNewDocStore: true` and `docStore: { name, description }`.

### 2. Supabase vector store + metadata filter (single store)

- Use one Flowise document store backed by **Supabase** (table `documents`, function `match_documents`).
- On upsert, set document `metadata.profile_id = user.id`.
- In predict, set `overrideConfig.supabaseMetadataFilter = { profile_id: user.id }` so retrieval is per-user.
- No `flowise_user_document_stores` table; linkage is “same table, filter by metadata”.

---

## Flowise backend on Postgres (optional)

If you move Flowise off SQLite to Postgres (e.g. for production or multi-instance):

1. **Use a dedicated Supabase project or DB** to avoid table/schema clashes with the app (Flowise creates many tables).
2. **Environment variables** (in Flowise’s `.env` or deployment config):
   - `DATABASE_TYPE=postgres`
   - `DATABASE_HOST=db.<ref>.supabase.co` (from Supabase project settings)
   - `DATABASE_PORT=5432`
   - `DATABASE_NAME=postgres`
   - `DATABASE_USER=postgres`
   - `DATABASE_PASSWORD=<your-db-password>`
   - `DATABASE_SSL=true`
3. **Connection**: Direct Postgres (port 5432), not the pooler port (6543). Flowise runs as a long-lived process.

See [Flowise configuration – environment variables](https://docs.flowiseai.com/configuration/environment-variables) for the full list.

---

## Related files

- Migrations: `supabase/migrations/20260219120002_flowise_embed_config.sql`, `20260301120000_flowise_chatflow_assignments_and_profile_api_key.sql`, `20260320120000_flowise_user_document_stores.sql`, `20260320120001_profiles_default_chatflow_id.sql`
- API: `apps/web/app/api/flowise/` (predict, embed-config, document-store proxy, **user-document-store** GET/POST)
- Client: `apps/web/components/dojo/dojo-flowise-config-client.tsx`, `dojo-flowise-chatbot.tsx`
- Notes: `docs/FLOWISE-SDK-INTEGRATION-NOTES.md`
