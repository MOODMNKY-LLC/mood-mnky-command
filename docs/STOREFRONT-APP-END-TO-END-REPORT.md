# Storefront App — End-to-End Report & Breakdown

This document describes how the mood-mnky-command app works on the Shopify storefront and how it can be used beyond the in-store chat (MNKY CHAT).

---

## 1. Architecture Overview

The storefront experience is delivered in two ways:

1. **App embed (MNKY CHAT)** — A floating chat widget injected on every store page via Theme settings → App embeds. It loads the app in an iframe and communicates via `postMessage`.
2. **App blocks** — Sections added to the theme (e.g. homepage) that link to app routes (Blending Lab, Verse blog, Match My Mood, Subscription). No iframe; they are links and optional dynamic content (e.g. Verse blog block fetches from the app API).

Both use a single **App base URL** (e.g. `https://mnky-command.moodmnky.com`) configured in the theme. The app is a Next.js app (Vercel or self-hosted); the store is the native Shopify storefront (Liquid theme).

---

## 2. MNKY CHAT — End-to-End Flow

### 2.1 Storefront (Shopify theme)

- **Embed:** `extensions/mood-mnky-theme/blocks/mnky-assistant-embed.liquid`
- **Where:** Theme settings → App embeds → **MNKY CHAT** (enable + set App base URL).
- **Rendering:** A fixed-position button (bottom-left or bottom-right) and a panel that opens on click. The panel contains an **iframe** whose `src` is `{App base URL}/assistant/widget`.
- **Communication:**
  - **Widget → theme:** `window.parent.postMessage({ type: "mnky-assistant-close" }, "*")` to close the panel; `{ type: "mnky-assistant-status", status: "idle"|"streaming" }` to drive the button’s visual state (e.g. pulse while the assistant is responding).
  - **Theme → widget:** The theme listens for these messages and shows/hides the panel or updates the toggle’s `data-status`.

### 2.2 Widget UI (Next.js app)

- **Route:** `app/assistant/widget/page.tsx` (served at `/assistant/widget`).
- **Layout:** `app/assistant/widget/layout.tsx` — full-height container (`h-dvh`) so the iframe has a fixed height and the chat layout can use a fixed header, scrollable messages, and fixed input.
- **Chat layout (classic chat UX):**
  - **Header (fixed):** “MNKY CHAT” + subtext “Ask about fragrances, products & the MNKY VERSE”, logo, close button. Close sends `mnky-assistant-close` to the parent so the theme closes the panel.
  - **Message area (fixed height, scrollable):** Messages and empty state (suggested prompts). Uses a single scroll container so the list scrolls and the header/input do not move.
  - **Input bar (fixed):** Text area + submit; always at the bottom.
- **Client state:** Anonymous ID in `localStorage` (`mnky_anonymous_id`) for session continuity without login. Session ID is returned by the API and sent on subsequent requests.

### 2.3 API (Next.js)

- **Route:** `app/api/storefront-assistant/route.ts` (POST).
- **Auth:** No Shopify or user auth. Identifies the “user” by:
  - Header `x-mnky-anonymous-id` (from the widget).
  - Optional body `sessionId` to continue an existing session; must match `anonymous_id` in the DB.
- **Session persistence:** Supabase tables `storefront_chat_sessions` (per anonymous_id) and `storefront_chat_messages` (per session). The API uses the **service role** client so RLS does not block server-side writes.
- **Flow:**
  1. Resolve or create a session (by `sessionId` + `anonymous_id` or create new row).
  2. Enforce message limit per session (e.g. 50).
  3. Append the latest user message to the DB.
  4. Load last N messages for context.
  5. Build system prompt (includes `{app_base_url}` for links to the app).
  6. Call OpenAI with tools (see below), stream the response.
  7. On stream finish, append assistant message to the DB.
  8. Response headers include `x-mnky-session-id` for the client to reuse.
- **Tools (Storefront API + Supabase):**
  - **searchProductsTool** — Storefront API product search (e.g. by keyword, scent).
  - **getShopPoliciesTool** — Storefront API shop policies (shipping, refunds, etc.).
  - **searchVerseBlogTool** — Fetches Verse blog posts (app API or internal).
  - **searchKnowledgeBaseTool** — Supabase `assistant_knowledge` (Notion-synced FAQ, about, policies).

So: **Storefront (Liquid) → iframe (widget) → POST /api/storefront-assistant → Supabase (sessions/messages + knowledge) + Storefront API (products, policies) + OpenAI → streamed reply back to widget.**

---

## 3. How the App Is Used Beyond Chat

The same App base URL is used for **outbound links** from the store to the app. These are **not** the chat; they are separate app experiences.

| Use case | Where it’s used | App path | Purpose |
|----------|------------------|----------|---------|
| **Blending Lab** | App block “Blending Lab CTA” (and similar CTAs) | `/blending` | Custom fragrance blending. |
| **Match My Mood / Fragrance finder** | App block “Match My Mood CTA” | `/craft` | Discovery / fragrance finder. |
| **MNKY VERSE blog** | App block “Latest from MNKY VERSE” + “View all” | `/verse/blog` | Blog listing; block can call app API for recent posts. |
| **Subscription / discovery** | App block “Subscription CTA” | `/blending` (default) or configurable path | Subscription or discovery flow. |

**Chat’s role:** The assistant is instructed (in `lib/chat/storefront-system-prompt.ts`) to suggest these app experiences when relevant (e.g. “Browse the [Blending Lab]({app_base_url}/blending) to create a custom scent”). So:

- **In-store:** Visitor uses MNKY CHAT for product questions, shipping, and “what is MNKY VERSE?” — and can be directed to the app via links in the assistant’s replies.
- **Outside chat:** Visitor clicks a CTA on the homepage (or other sections) and goes straight to the app at `{App base URL}/blending`, `/craft`, `/verse/blog`, etc.

The app is therefore used in two ways on the storefront: (1) **embedded chat** (iframe) for real-time Q&A, and (2) **linked experiences** (full app pages) for blending, discovery, and blog.

---

## 4. Configuration Summary

| Item | Where | Purpose |
|------|--------|---------|
| **App base URL** | Theme: App embeds (MNKY CHAT) and each App block | Base URL of the Next.js app (e.g. `https://mnky-command.moodmnky.com`). |
| **Storefront API** | App env (e.g. Storefront API token, store domain) | Used by `storefront-assistant` tools to search products and fetch policies. |
| **Supabase** | App env (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`) | Sessions, messages, and `assistant_knowledge` for the storefront assistant. |
| **OpenAI** | App env (`OPENAI_API_KEY`) | Model and streaming for the assistant. |

---

## 5. Chat UI Summary (After Latest Changes)

- **Branding:** Header title “MNKY CHAT” with subtext “Ask about fragrances, products & the MNKY VERSE”.
- **Layout:** Grid with three rows: header (auto), message area (1fr, scrollable), input bar (auto). So: fixed header, fixed input, scrollable messages.
- **Theme embed:** Toggle and panel labels/aria and schema name updated to “MNKY CHAT” for consistency.

---

## 6. References

- **App blocks and embeds:** `Shopify/docs/APP-BLOCKS-BREAKDOWN.md`
- **App URL config:** `docs/SHOPIFY-APP-URL-CONFIG.md` (if present)
- **Storefront assistant API:** `app/api/storefront-assistant/route.ts`
- **Storefront tools:** `lib/chat/storefront-tools.ts`
- **System prompt:** `lib/chat/storefront-system-prompt.ts`
