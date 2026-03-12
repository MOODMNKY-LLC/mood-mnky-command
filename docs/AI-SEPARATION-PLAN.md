# AI Integration Separation Plan

This document analyzes the app's AI chat architecture and provides a clear plan for separating **Flowise** (user-facing) from **direct OpenAI** (admin/developer). Flowise integration has been temporarily removed; this plan guides reintroduction.

---

## Current Architecture (Post-Removal)

### Direct OpenAI Integration — Admin/Developer Use

| Component | Location | Purpose |
|-----------|----------|---------|
| **AI Chat** | `/chat` | In-app chat with tools (blending, formulas, images, etc.) |
| **API** | `app/api/chat/route.ts` | `streamText` from AI SDK, OpenAI models |
| **Tools** | `lib/chat/tools.ts` | 14 tools: search oils, calculate proportions, show cards, save blends, etc. |
| **System prompt** | `lib/chat/system-prompt.ts` | Lab assistant persona, tool usage guidance |
| **UI** | `app/(dashboard)/chat/page.tsx` | Chat interface with tool result cards |

**Characteristics:**
- Uses `@ai-sdk/openai` and `streamText`
- Full tool ecosystem with structured tool results rendered as React cards
- Auth: Supabase session (in-app user)
- Access: Dashboard sidebar → MNKY Chat → AI Chat

**Additional OpenAI usage (non-chat):**
- `app/api/platform/ai-sql/route.ts` — natural language to SQL
- `app/api/funnels/ai/suggest-questions/route.ts` — form schema generation
- `lib/openai/` — audio (TTS/transcribe), videos, images
- Studio: Image, Audio, Video generation

---

### Flowise Integration — User-Facing (Removed, Planned Reintroduction)

| Component | Original Location | Purpose |
|-----------|-------------------|---------|
| **Fragrance Crafting** | `/craft` | Dedicated user-facing guided blending flow |
| **Embed** | flowise-embed CDN | Embedded chat UI in Flowise |
| **Proxy** | `app/api/flowise/tools/[tool]/route.ts` | Custom Tools called by Flowise POST to our API |
| **Handlers** | `lib/flowise/handlers.ts` | Same logic as chat tools, text output for Flowise |
| **Tool definitions** | `docs/archive/flowise/tools/*.json` | Flowise Custom Tool schemas + fetch to proxy |

**Characteristics:**
- Flowise hosts the LLM and chatflow; our app only provided tool proxy
- Text-only output: tools return JSON serialized to string for Flowise LLM
- Auth: `FLOWISE_API_KEY` (Bearer) + `userId` in body from embed
- Access: Dashboard sidebar → MNKY Chat → Fragrance Crafting

---

## Separation Strategy

### Principle

| Layer | Flowise (User-Facing) | Direct OpenAI (Admin/Developer) |
|-------|------------------------|--------------------------------|
| **Audience** | End users (customers) | Admins, lab staff, developers |
| **Entry point** | `/craft` (Flowise embed) | `/chat` (in-app chat) |
| **LLM host** | Flowise server | Next.js API (OpenAI) |
| **Tool execution** | Proxy: Flowise → `/api/flowise/tools/[tool]` | In-process: `lib/chat/tools.ts` |
| **Output format** | Text (JSON serialized for LLM) | Structured tool results → React cards |
| **Auth** | Flowise API key + userId from embed | Supabase session |

### Shared Logic

Both integrations use the same domain logic:
- `lib/chat/blending-calc.ts` — proportions, wax calc, containers
- Supabase: `fragrance_oils`, `saved_blends`, `funnel_runs`, `funnel_answers`
- JotForm client for form questions
- Shopify for product picker

**Do not duplicate.** When reintroducing Flowise, restore:
1. `app/api/flowise/tools/[tool]/route.ts` — proxy with `FLOWISE_API_KEY` validation
2. `lib/flowise/handlers.ts` — thin wrappers that call shared logic (or reuse `lib/chat/tools.ts` execute functions)
3. `lib/flowise/proxy.ts` — validation + `toFlowiseText()`

---

## Reintroduction Checklist

When ready to bring Flowise back:

1. **Restore API proxy**
   - Create `app/api/flowise/tools/[tool]/route.ts`
   - Implement handlers (or delegate to shared execute logic from `lib/chat/tools.ts`)

2. **Restore lib/flowise**
   - `lib/flowise/proxy.ts` — validation, `toFlowiseText`
   - `lib/flowise/handlers.ts` — handler implementations

3. **Restore craft page**
   - Load flowise-embed script
   - `Chatbot.init({ chatflowid, apiHost, chatflowConfig: { vars: { userId, moodMnkyApiUrl } } })`

4. **Restore env vars** (in `.env.example` and deployment)
   - `FLOWISE_API_KEY`
   - `NEXT_PUBLIC_FLOWISE_HOST`
   - `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`
   - `NEXT_PUBLIC_FLOWISE_CHATFLOW_API_KEY`
   - `NEXT_PUBLIC_MOODMNKY_API_URL` (optional)

5. **Deploy Flowise chatflow**
   - Use tool JSON from `docs/archive/flowise/tools/`
   - Configure variables: `moodMnkyApiUrl`, `moodMnkyApiKey`
   - See `docs/FLOWISE-CHATFLOW-SETUP.md`

6. **Verify**
   - Sign in → /craft → Flowise embed loads
   - Send message → tools call `/api/flowise/tools/*` → responses flow back

---

## Confusion Points (Resolved)

| Question | Answer |
|----------|--------|
| Why two chat experiences? | Flowise = dedicated user-facing flow (configurable in Flowise UI). OpenAI chat = in-app admin/lab tool with full UI control. |
| Same tools? | Yes. Domain logic (oils, proportions, blends) is shared. Flowise proxies; OpenAI runs in-process. |
| AI elements (BlendSuggestionsCard, etc.)? | Used only by OpenAI chat. Flowise gets text; the LLM describes results to the user. |
| Can we use Flowise for admin chat? | Possible but not the plan. Admin chat stays OpenAI for simplicity and tool-card rendering. |

---

## Files Removed (Flowise Removal)

- `app/api/flowise/tools/[tool]/route.ts` — deleted
- `lib/flowise/handlers.ts` — deleted
- `lib/flowise/proxy.ts` — deleted
- `flowise/` — moved to `docs/archive/flowise/`
- Craft page — replaced with "Coming Soon" placeholder linking to `/chat`

## Files Preserved (OpenAI Chat)

- `app/api/chat/route.ts`
- `lib/chat/tools.ts`
- `lib/chat/system-prompt.ts`
- `lib/chat/blending-calc.ts`
- `app/(dashboard)/chat/page.tsx`
- `components/ai-elements/*` (BlendSuggestionsCard, InlineIntakeForm, etc.)
