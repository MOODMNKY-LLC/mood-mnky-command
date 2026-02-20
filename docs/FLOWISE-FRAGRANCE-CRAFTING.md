# Flowise Fragrance Crafting Setup

> **Notice (2025-02):** Flowise integration has been **temporarily removed** from the app. This document is preserved for when Flowise is reintroduced. See [AI-SEPARATION-PLAN.md](./AI-SEPARATION-PLAN.md) for the architecture plan.

This document describes how to set up and use the Flowise-powered fragrance crafting flow, which provides a separated user-facing chat experience distinct from the admin backend.

## Overview

- **Admin**: Funnel management, form builder, platform config — stays in MOOD MNKY Next.js (`/platform/funnels`, etc.).
- **User-facing**: Fragrance crafting chat — hosted in Flowise, embedded at `/craft`.
- **Proxy**: Flowise Custom Tools POST to `/api/flowise/tools/[tool]`; our API runs the logic and returns text.

## Architecture

```
User (Browser) ──► Flowise Embed ──► Flowise Chatflow
                                           │
                              Custom Tools │
                                           ▼
                              POST /api/flowise/tools/[tool]
                              (Authorization: Bearer FLOWISE_API_KEY)
                                           │
                              ─────────────┴─────────────
                              │  MOOD MNKY Backend      │
                              │  Supabase, JotForm,     │
                              │  Shopify, etc.          │
                              ──────────────────────────
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `FLOWISE_API_KEY` | Key our API expects when Flowise Custom Tools call `/api/flowise/tools/*`. Same value as `MOODMNKY_API_KEY` in Flowise (env-backed). Store as Runtime variable in Flowise—do not hardcode. |
| `NEXT_PUBLIC_FLOWISE_HOST` | Flowise server URL (e.g. `https://flowise-dev.moodmnky.com`). Used by the embed. |
| `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID` | Chatflow ID for Fragrance Crafting. Used by the embed. |

**Two distinct keys:** (1) **FLOWISE_API_KEY** (our env) = key we validate for `/api/flowise/tools/*`. (2) Flowise chatflow API key = protects Flowise's `/api/v1/prediction/...`. Do not conflate them.

## Tool Mapping

Each Flowise Custom Tool POSTs to the corresponding proxy route:

| Tool | Proxy Route | Params | Returns |
|------|-------------|--------|---------|
| `getLatestFunnelSubmission` | `POST /api/flowise/tools/submission` | `userId`, `sessionId`, `funnelId?` | Submission or null |
| `showIntakeForm` | `POST /api/flowise/tools/intake-form` | `userId`, `sessionId`, `funnelId?` | Form schema, runId |
| `submitIntakeAnswers` | `POST /api/flowise/tools/intake-answers` | `userId`, `runId`, `funnelId`, `answers` | Success/error |
| `searchFragranceOils` | `POST /api/flowise/tools/search-oils` | `userId`, `sessionId`, `query`, `limit?` | Oils array |
| `calculateBlendProportions` | `POST /api/flowise/tools/proportions` | `userId`, `sessionId`, `oils`, `preferences?`, `productType?` | Proportions |
| `showBlendSuggestions` | `POST /api/flowise/tools/blend-suggestions` | `oils`, `proportions`, `explanation?` | Echo (for LLM context) |
| `showProductPicker` | `POST /api/flowise/tools/product-picker` | `blendName?`, `productType?`, `limit?` | Products |
| `showPersonalizationForm` | `POST /api/flowise/tools/personalization-form` | `blendSummary`, `promptForImage?` | Needs-input marker |
| `saveCustomBlend` | `POST /api/flowise/tools/save-blend` | `userId`, `name`, `productType`, `fragrances`, ... | blendId |

All requests must include `userId` and `sessionId` in the body. Authentication is via `Authorization: Bearer <FLOWISE_API_KEY>` or `x-api-key` header.

**Manga tools (Companion):** Hotspot mapper and quiz generator use the same pattern: `POST` to `/api/flowise/tools/manga/hotspot-mapper` and `/api/flowise/tools/manga/quiz-generator` with `Authorization: Bearer <MOODMNKY_API_KEY>` and JSON body `{ "issueSlug": "..." }`. See [COMPANION-MANGA-ROADMAP.md](COMPANION-MANGA-ROADMAP.md) → “Calling app tools from Flowise (Manga)”.

## Flowise Custom Tool Example

Each Custom Tool in Flowise should POST to the MOOD MNKY API. Example (submission tool):

```javascript
const baseUrl = $vars.moodMnkyApiUrl || 'https://your-app.vercel.app';
const apiKey = $vars.moodMnkyApiKey;

const res = await fetch(`${baseUrl}/api/flowise/tools/submission`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    userId: $vars.userId,
    sessionId: $flow.sessionId,
    funnelId: $input.funnelId,
  }),
});

const text = await res.text();
return text;
```

Configure in Flowise:
- **Variables** (Runtime): `userId` (from embed), `moodMnkyApiUrl`, `moodMnkyApiKey`
- **Embed** passes `chatflowConfig: { vars: { userId } }`

## Embed Configuration

The `/craft` page embeds Flowise using `flowise-embed`:

```javascript
Chatbot.init({
  chatflowid: process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID,
  apiHost: process.env.NEXT_PUBLIC_FLOWISE_HOST,
  chatflowConfig: {
    vars: {
      userId: currentUser.id,  // From Supabase auth
    },
  },
});
```

The user must be signed in. The page requires `NEXT_PUBLIC_FLOWISE_HOST` and `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID` to be set.

## Per-User Access

- Flowise assigns one API key per chatflow. All users share the same chatflow and key.
- Per-user isolation is achieved via `vars.userId`. Custom Tools forward `userId` to our proxy.
- Our API uses `userId` to enforce RLS-equivalent behavior (filter funnel_runs, saved_blends by user_id).

## Text-Only Mode

Phase 1 uses **text-only** output. Tools return JSON; we serialize to a string for Flowise. The LLM receives the data and describes it to the user in natural language. No React cards (BlendSuggestionsCard, InlineIntakeForm, etc.) — users refine blends via chat.

## Flowise Setup Checklist

1. Deploy Flowise (Docker or Flowise Cloud). Current: `https://flowise-dev.moodmnky.com`
2. Create a Chatflow or Agentflow. Current chatflow ID: `05ba7573-aab4-4c63-8f96-1c9be92252cc`
3. **See [FLOWISE-CHATFLOW-SETUP.md](./FLOWISE-CHATFLOW-SETUP.md)** for step-by-step Custom Tool code, Input Schemas, and system prompt.
4. Configure Flowise variables: `moodMnkyApiUrl` (static, MOOD MNKY app URL), `moodMnkyApiKey` (Runtime, from `process.env.MOODMNKY_API_KEY`—do not hardcode).
5. Assign an API key to the chatflow (for Flowise prediction API).
6. Set `NEXT_PUBLIC_FLOWISE_HOST`, `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`, `FLOWISE_API_KEY` in the app.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized on proxy | `FLOWISE_API_KEY` must match the key Flowise sends (`Authorization: Bearer`). Rotate if key was exposed. |
| `userId is required` | Ensure embed passes `chatflowConfig.vars.userId`. Enable Override Configuration for `vars` in chatflow Configuration UI (disabled by default). |
| Flowise vars not populated | Enable Override Configuration in chatflow Configuration and allow overriding the specific variable. |
| Embed shows "Flowise not configured" | Set `NEXT_PUBLIC_FLOWISE_HOST` and `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`. |
