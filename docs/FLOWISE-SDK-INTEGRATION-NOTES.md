# Flowise SDK and API Integration Notes

## flowise-sdk (FlowiseClient)

- **Constructor**: `FlowiseClient({ baseUrl?, apiKey? })`. Both optional; `apiKey` is sent as Bearer token to Flowise.
- **createPrediction**: Supports `chatflowId`, `question`, `overrideConfig`, `history`, `streaming`, `uploads` (array of `{ data?, type, name, mime }` for base64 file uploads). Use for Dojo chat: pass user's `override_config` from `flowise_chatflow_assignments` and optional user API key via a client created with `new FlowiseClient({ baseUrl, apiKey: userApiKey })`.
- **Document store**: Not exposed in the SDK. Use REST via `flowiseFetch` (or a variant that accepts optional `apiKey`): e.g. `GET /api/v1/document-store/store`, `POST /api/v1/document-store/upsert/{id}` (multipart). Flowise Document Store API uses Bearer auth; paths under `/api/v1/` (confirm base path in Flowise version).

## Per-user API key

- Store encrypted in `profiles.flowise_api_key_encrypted`; decrypt server-side only. When calling Flowise on behalf of a user (predict, document store proxy), create `FlowiseClient({ baseUrl, apiKey: decryptedKey })` or pass key to `flowiseFetch`-style helper for REST endpoints. Never expose raw key to client.

## Override config and uploads

- Predict API: merge `override_config` from `flowise_chatflow_assignments` with request body; support `uploads` in Dojo chat input for RAG/file-aware chatflows.
