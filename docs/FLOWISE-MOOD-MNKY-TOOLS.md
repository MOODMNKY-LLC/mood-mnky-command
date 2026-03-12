# MOOD MNKY Custom Tools for Flowise

This document describes the app’s tool-façade API used by Flowise chatflows (e.g. the MOOD MNKY Tool Agent). Add these as **Custom Tool** (or OpenAPI-based tool) nodes in your Flowise Chatflow so the agent can call them.

## Authentication

All tool endpoints require:

- **Header:** `Authorization: Bearer <MOODMNKY_API_KEY>`
- **Env:** Set `MOODMNKY_API_KEY` in your app’s environment. In Flowise, pass the same key when configuring the Custom Tool (e.g. as a variable `moodMnkyApiKey` and use it in the tool’s headers).

Never expose `MOODMNKY_API_KEY` to the client. Flowise runs server-side and should call your app’s **public base URL** (e.g. `https://your-app.vercel.app` or your production domain).

## Base URL

Use your deployed app URL as the base, e.g.:

- Development: `http://localhost:3000`
- Production: `https://your-app.vercel.app`

Paths below are relative to this base.

---

## Endpoints

### 1. Get issue context (manga / lore)

**Purpose:** Fetch issue and chapter data (title, arc summary, chapters, fragrance names, setting) for answering lore questions or generating quizzes.

| Item | Value |
|------|--------|
| **Method** | POST |
| **Path** | `/api/flowise/tools/lore/get-issue-context` |
| **Content-Type** | application/json |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issueSlug` | string | Yes | Issue slug (e.g. from MNKY VERSE manga). |

**Example:** `{ "issueSlug": "issue-01" }`

**Response:** JSON with `issue`, `chapters`, and related fields. 404 if issue not found.

---

### 2. Resolve product (Shopify)

**Purpose:** Look up a Shopify product or collection by handle, query, or GID. Use for “what product is this?” or linking manga to shop.

| Item | Value |
|------|--------|
| **Method** | POST |
| **Path** | `/api/flowise/tools/shopify/resolve-product` |
| **Content-Type** | application/json |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `handle` | string | No* | Product or collection handle. |
| `query` | string | No* | Search query. |
| `gid` | string | No* | Shopify GID (e.g. `gid://shopify/Product/123`). |

*At least one of `handle`, `query`, or `gid` must be provided.

**Response:** JSON with product/collection data. Use for titles, handles, and links; never invent product names or URLs.

---

### 3. Propose XP award (Dojo gamification)

**Purpose:** Propose an XP award for a user (e.g. after a quiz or quest). This endpoint only **proposes**; the actual award must be applied via a separate step (e.g. `POST /api/xp/award` or admin action). The agent must not promise “you earned X XP” until the system has confirmed.

| Item | Value |
|------|--------|
| **Method** | POST |
| **Path** | `/api/flowise/tools/xp/propose-award` |
| **Content-Type** | application/json |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | string (UUID) | Yes | User profile ID. |
| `source` | string | Yes | Source of the award (e.g. `mag_quiz`, `quest_complete`). |
| `sourceRef` | string | No | Reference (e.g. issue slug, quiz id). |
| `xpDelta` | number (integer) | Yes | XP to award (positive). |
| `reason` | string | No | Human-readable reason. |

**Response:** `{ "ok": true, "proposed": true, "profileId", "xpDelta" }`.

---

### 4. Manga quiz generator

**Purpose:** Returns issue and chapter context so the LLM can generate quiz questions for that issue. Use when the user or flow needs a quiz from manga content.

| Item | Value |
|------|--------|
| **Method** | POST |
| **Path** | `/api/flowise/tools/manga/quiz-generator` |
| **Content-Type** | application/json |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issueSlug` | string | Yes | Issue slug. |

**Response:** JSON with issue, chapters, and context. The agent (or a follow-up step) should turn this into questions and options; pass threshold is configured in `config_xp_rules` (e.g. `mag_quiz.pass_threshold`).

---

### 5. Manga hotspot mapper

**Purpose:** Returns issue, chapters, panels, and existing hotspots. Use when the task is to suggest or map hotspots (product/variant/collection/bundle) to manga panels.

| Item | Value |
|------|--------|
| **Method** | POST |
| **Path** | `/api/flowise/tools/manga/hotspot-mapper` |
| **Content-Type** | application/json |

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issueSlug` | string | Yes | Issue slug. |
| `chapterOrder` | number (integer) | No | Limit to one chapter by order. |

**Response:** JSON with issue, chapters, panels, and existing hotspots. Suggested output shape for new hotspots: `{ suggestions: [ { chapter_order, panel_number, type, shopify_gid, x, y, label, tooltip } ] }` (types: `product` \| `variant` \| `collection` \| `bundle`; x, y in 0..1).

---

## Adding these tools in Flowise

1. **Custom Tool / API node:** For each endpoint, add a Custom Tool (or HTTP Request tool) in your Chatflow. Set:
   - URL: `{{baseUrl}}/api/flowise/tools/...` (use a Flowise variable for `baseUrl`).
   - Method: POST.
   - Headers: `Authorization: Bearer {{moodMnkyApiKey}}`, `Content-Type: application/json`.
   - Body: map the tool’s input parameters to the JSON body (e.g. `issueSlug`, `profileId`, etc.).

2. **Variables:** In Flowise, define:
   - `baseUrl`: your app’s public URL.
   - `moodMnKyApiKey`: value of `MOODMNKY_API_KEY` (from your app env; store in Flowise credentials or env and reference in the tool).

3. **Tool Agent:** Connect all Custom Tool nodes to the Tool Agent’s **Tools** input. The system prompt in [flowise-tool-agent-prompt.ts](../apps/web/lib/chat/flowise-tool-agent-prompt.ts) describes when to use each capability; tool names in Flowise can match or differ as long as the agent’s descriptions are clear.

4. **OpenAPI (optional):** If your Flowise version supports importing an OpenAPI spec for tools, use [temp/flowise-mood-mnky-tools-openapi.json](temp/flowise-mood-mnky-tools-openapi.json) (see below).

---

## OpenAPI spec

An OpenAPI 3.0 spec for these five endpoints is provided at `temp/flowise-mood-mnky-tools-openapi.json`. You can use it to generate Custom Tools or to document the API. Replace `https://your-app.vercel.app` with your actual base URL and configure the security scheme with your `MOODMNKY_API_KEY` where Flowise expects it.
