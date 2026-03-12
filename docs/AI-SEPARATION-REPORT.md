# AI Separation Report: Flowise vs OpenAI

## Overview

MOOD MNKY implements a clear architectural separation between two AI integration patterns:

1. **Flowise** — Primary for chatflow/chatbot workflows (with OpenAI fallback)
2. **OpenAI** — Exclusive for server-side AI processing (embeddings, images, agents, platform AI)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Flowise — Chatflow/Chatbot                    │
├─────────────────────────────────────────────────────────────────┤
│  User Chat UI → Flowise SDK Bridge → Hosted Flowise Instance    │
│       ↓                                                         │
│  Document Store (S3/MinIO)                                      │
│       ↓                                                         │
│  OpenAI Fallback (when Flowise unavailable)                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 OpenAI — Server-Side AI                          │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes → streamText / Agents SDK → Tools            │
│  • /api/chat (fallback)                                         │
│  • /api/labz/chat                                               │
│  • /api/verse/chat                                              │
│  • /api/platform/ai-sql                                         │
│  • /api/dojo/blends/describe                                    │
│  • /api/images/*, /api/videos/*, /api/realtime/*                 │
└─────────────────────────────────────────────────────────────────┘
```

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Flowise primary for chat | Visual chatflow builder, rapid iteration, custom tools via HTTP, document store RAG |
| OpenAI fallback | Resilience when Flowise is down; same Elements AI SDK UI for both |
| OpenAI for server-side | Low latency, structured outputs, in-process tools, no external orchestration |
| Document store via Flowise | S3/MinIO configured on Flowise instance; app proxies requests |

## Environment Variables

### Flowise

| Variable | Purpose |
|----------|---------|
| `FLOWISE_BASE_URL` | Flowise instance root (e.g. https://flowise-dev.moodmnky.com) |
| `FLOWISE_API_KEY` | Bearer token for Flowise API |
| `NEXT_PUBLIC_FLOWISE_HOST` | Client-side (embed) |
| `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID` | Default Dojo chatflow |

### Flowise S3/MinIO (hosted instance)

Set in Flowise `.env`, not in app. App proxies document store via `FLOWISE_BASE_URL`.

| Variable | Purpose |
|----------|---------|
| `STORAGE_TYPE` | `s3` |
| `BLOB_STORAGE_PATH` | e.g. /root/.flowise/storage |
| `S3_STORAGE_BUCKET_NAME` | Bucket name |
| `S3_STORAGE_ACCESS_KEY_ID` | MinIO/S3 access key |
| `S3_STORAGE_SECRET_ACCESS_KEY` | MinIO/S3 secret |
| `S3_STORAGE_REGION` | e.g. us-east-1 |
| `S3_ENDPOINT_URL` | e.g. https://s3-api-data.moodmnky.com |
| `S3_FORCE_PATH_STYLE` | `true` for MinIO |

### OpenAI

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Server-side AI, fallback chat |

## Package List

| Package | Purpose |
|---------|---------|
| `ai` | Vercel AI SDK (streamText, useChat) |
| `@ai-sdk/react` | React hooks for chat |
| `@ai-sdk/openai` | OpenAI provider for AI SDK |
| `flowise-sdk` | FlowiseClient, createPrediction |
| `flowise-embed-react` | Flowise embed widget |
| `@openai/agents` | Multi-agent workflows (stub; requires Zod v4) |

## Document Store Setup

### Flowise Document Store API

App proxies these endpoints:

| App Route | Flowise Path | Method |
|-----------|--------------|--------|
| `/api/flowise/document-store/stores` | `/document-store/store` | GET |
| `/api/flowise/document-store/stores/[id]` | `/document-store/store/{id}` | GET |
| `/api/flowise/document-store/upsert/[id]` | `/document-store/upsert/{id}` | POST (multipart) |
| `/api/flowise/document-store/refresh/[id]` | `/document-store/refresh/{id}` | POST |
| `/api/flowise/document-store/vectorstore/query` | `/document-store/vectorstore/query` | POST |
| `/api/flowise/document-store/loader/[storeId]/[loaderId]` | `/document-store/loader/{storeId}/{loaderId}` | DELETE |

### LABZ Document Store

| App Route | Purpose |
|-----------|---------|
| `/api/labz/document-store/stores` | List stores (LABZ context) |
| `/api/labz/document-store/upsert/[id]` | Upsert files (formula docs, knowledge base) |

### User-Side (Dojo)

- `DojoFlowiseConfigClient` lists stores and upserts via `/api/flowise/document-store/*`
- Per-user Flowise API key supported when `FLOWISE_KEY_ENCRYPTION_SECRET` is set

## Key Files

- `apps/web/lib/flowise/client.ts` — FlowiseClient, flowiseFetch
- `apps/web/lib/flowise/health.ts` — checkFlowiseHealth()
- `apps/web/components/dojo/dojo-flowise-chatbot.tsx` — Flowise primary, OpenAI fallback
- `apps/web/app/api/flowise/predict/route.ts` — Prediction proxy
- `apps/web/lib/openai/agents.ts` — Agents SDK stub (Zod v4 pending)
