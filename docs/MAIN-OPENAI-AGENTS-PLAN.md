# Plan: Integrate OpenAI Agents SDK into the Main Section

## Goal

Define how to integrate the **OpenAI Agents SDK** (`@openai/agents`) into the `/main` marketing section so that the Main landing can use agent-based chat (and optionally multi-agent handoffs) while staying aligned with the existing AI separation (OpenAI server-side, no Flowise on Main).

## Current State

- **Main chat**: `MainChatbot` calls `/api/main/chat-demo`, which uses the **AI SDK** (`streamText`) with a fixed system prompt (MOOD MNKY). No tools, no agents SDK.
- **OpenAI Agents SDK**: Present as `@openai/agents` in the repo; **stubbed** in `lib/openai/agents.ts` because the SDK expects **Zod v4** and the project currently uses Zod v3. Full usage is blocked until Zod is upgraded or the SDK supports Zod v3.
- **Design**: Main is monochrome, editorial; chat is a compact “Meet MOOD MNKY” block. No auth required for the demo.

## Options

| Option | Description | Effort |
|--------|-------------|--------|
| **A. Keep AI SDK, add tools** | Continue using `streamText` in `/api/main/chat-demo`; add optional tools (e.g. fetch main landing FAQ from Supabase, or search VERSE) so the model can use data. No Agents SDK. | Low |
| **B. Single agent (after Zod v4)** | Once Zod v4 is adopted, implement a single **MOOD MNKY** agent via `@openai/agents` (instructions, optional tools). New route (e.g. `/api/main/agent`) runs the agent and streams output; `MainChatbot` keeps the same UI and swaps the endpoint. | Medium |
| **C. Multi-agent handoffs on Main** | Same as B, plus handoffs to SAGE MNKY / CODE MNKY from the same Main chat surface (e.g. “Ask SAGE” / “Talk to CODE”). One entry agent (MOOD) and specialist agents; handoff and response streaming wired to the existing chat UI. | High |

## Recommended Path

1. **Short term (no Zod change)**  
   - **Option A**: Add 1–2 optional tools to `/api/main/chat-demo` (e.g. `get_main_faq`, `get_main_features`) that read from `main_landing_*` Supabase tables. Keeps current stack, improves answers with real data. No Agents SDK yet.

2. **After Zod v4 (or SDK compatibility)**  
   - **Option B**: Implement `lib/openai/agents.ts` with a real MOOD MNKY agent (replace stub). Add `/api/main/agent` that runs the agent and returns a stream compatible with the AI SDK / `useChat` (or adapt the stream format for the existing `MainChatbot`). Point Main chat to this route.

3. **Later (optional)**  
   - **Option C**: Add SAGE and CODE agents and handoffs; expose “Switch to SAGE” / “Switch to CODE” in the Main chat UI and route to the same agent API with a selected agent or handoff target.

## Implementation Outline (Option B)

1. **Zod**  
   - Upgrade to Zod v4 (or confirm `@openai/agents` compatibility with Zod v3) and fix any breaking changes across the repo.

2. **Agent definition**  
   - In `lib/openai/agents.ts` (or `lib/openai/agents/main-mood-mnky.ts`): create MOOD MNKY agent with `name`, `instructions` (reuse/adapt `MAIN_DEMO_SYSTEM_PROMPT` from `/api/main/chat-demo`), and optional `tools` (e.g. fetch main landing content).

3. **API route**  
   - New route, e.g. `POST /api/main/agent`:  
     - Accepts `messages` (and optionally `agentId` for future multi-agent).  
     - Runs the agent via `run(agent, …)` (or the SDK’s streaming API if available).  
     - Returns a stream that the client can consume (e.g. AI SDK `toDataStreamResponse()`-compatible or a small adapter).

4. **MainChatbot**  
   - Keep `MainChatbot` as-is; switch `api` from `/api/main/chat-demo` to `/api/main/agent` (or make it configurable). If the agent stream format differs, add a thin adapter in the route so the existing `useChat` + stream handling still works.

5. **Tools for the agent (optional)**  
   - `get_main_landing_faq`, `get_main_landing_features`: call `getMainLandingData()` (or direct Supabase) and return structured data so the agent can cite FAQ or features in answers.

## Files to Touch (Option B)

| File | Change |
|------|--------|
| `lib/openai/agents.ts` | Replace stub with real Agent creation; export MOOD MNKY agent (and later SAGE, CODE). |
| `app/api/main/agent/route.ts` | New: run agent, stream response. |
| `components/main/main-chatbot.tsx` | Point to `/api/main/agent` (or env-driven endpoint). |
| `app/api/main/chat-demo/route.ts` | Keep as fallback or remove once agent route is stable. |

## Constraints

- **Main stays unauthenticated** for the chat demo; rate limiting (e.g. by IP) remains.
- **No Flowise** on Main; all agent logic is server-side OpenAI (per AI-SEPARATION-REPORT).
- **UI**: No required change to the editorial Main layout; only the backend and chat endpoint are swapped or extended.

## Implemented: Multi-agent handoffs (Option C, practical)

A **multi-agent handoff** experience is implemented on Main without the full OpenAI Agents SDK:

- **GET /api/main/agents** — Returns active agents from Supabase `agent_profiles` (slug, displayName, imagePath, systemInstructions). Used by the Main chat to render the agent selector.
- **POST /api/main/chat-demo** — Accepts optional `agentSlug`. When set, loads that agent’s `system_instructions` from `agent_profiles` and uses it as the system prompt; otherwise uses the default MOOD MNKY prompt.
- **MainChatbot** — Fetches agents, shows a tabbed agent selector (MOOD, SAGE, CODE) with avatars, and sends `agentSlug` in the request body with each message. “Hand off” suggestions (e.g. “Ask SAGE about learning”, “Talk to CODE about tech”) switch agent and send a prefilled message.

This uses the existing AI SDK `streamText` and ai-elements (Conversation, Message, etc.) with Supabase as the source of agent definitions and instructions.

## References

- `docs/AI-SEPARATION-REPORT.md` — Flowise vs OpenAI separation.
- `lib/openai/agents.ts` — Current stub and Zod v4 note.
- `app/api/main/chat-demo/route.ts` — Main chat API (accepts `agentSlug`).
- `app/api/main/agents/route.ts` — Main agents list (Supabase).
- `lib/main-landing-data.ts` — Public Supabase data for optional agent tools.
