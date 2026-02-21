# Flowise SDK and API Integration Notes

## flowise-sdk (FlowiseClient)

- **Constructor**: `FlowiseClient({ baseUrl?, apiKey? })`. Both optional; `apiKey` is sent as Bearer token to Flowise.
- **createPrediction**: Supports `chatflowId`, `question`, `overrideConfig`, `history`, `streaming`, `uploads` (array of `{ data?, type, name, mime }` for base64 file uploads). Use for Dojo chat: pass user's `override_config` from `flowise_chatflow_assignments` and optional user API key via a client created with `new FlowiseClient({ baseUrl, apiKey: userApiKey })`.
- **Document store**: Not exposed in the SDK. Use REST via `flowiseFetch` (or a variant that accepts optional `apiKey`). Flowise Document Store API uses Bearer auth; paths under `/api/v1/`.

## Document Store API Paths (Flowise)

| Path | Method | Purpose |
|------|--------|---------|
| `document-store/store` | GET | List all document stores |
| `document-store/store/{id}` | GET | Get store by ID |
| `document-store/upsert/{id}` | POST | Upsert documents (multipart/form-data) |
| `document-store/refresh/{id}` | POST | Re-process and upsert all documents |
| `document-store/vectorstore/query` | POST | Retrieval query (`{ storeId, query }`) |
| `document-store/loader/{storeId}/{loaderId}` | DELETE | Delete loader and chunks |

App proxy routes: `/api/flowise/document-store/*` and `/api/labz/document-store/*`.

## S3/MinIO Storage (Flowise instance)

Document store blob storage uses S3/MinIO. Configure in Flowise `.env` (not in app):

- `STORAGE_TYPE=s3`
- `S3_STORAGE_BUCKET_NAME`, `S3_STORAGE_ACCESS_KEY_ID`, `S3_STORAGE_SECRET_ACCESS_KEY`
- `S3_STORAGE_REGION`, `S3_ENDPOINT_URL`, `S3_FORCE_PATH_STYLE`

See `.env.example` and `docs/AI-SEPARATION-REPORT.md`.

## Per-user API key

- Store encrypted in `profiles.flowise_api_key_encrypted`; decrypt server-side only. When calling Flowise on behalf of a user (predict, document store proxy), create `FlowiseClient({ baseUrl, apiKey: decryptedKey })` or pass key to `flowiseFetch`-style helper for REST endpoints. Never expose raw key to client.

## Override config and uploads

- Predict API: merge `override_config` from `flowise_chatflow_assignments` with request body; support `uploads` in Dojo chat input for RAG/file-aware chatflows.
