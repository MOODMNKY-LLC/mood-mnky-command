# FFLogs Data and AI Analysis

This document summarizes what Hydaelyn gets from the FFLogs API, how it is used today, and a concrete plan for using the OpenAI Agents SDK and capable models to deliver player-relevant analysis. It is the deliverable of a focused deep-research pass aligned with the Hydaelyn landing/health/FFLogs+AI plan.

---

## 1. FFLogs data model: what we actually get

### 1.1 Aggregated / preprocessed data

FFLogs does not expose raw log files. They process uploads and expose:

| Source | Description | Format | Use in Hydaelyn |
|--------|-------------|--------|-----------------|
| **Report.table** | Summary/DamageDone/Healing/Deaths etc. by fight; `viewBy` Source/Target/Ability | GraphQL `JSON` scalar | Import → normalized `fflogs_fight_summaries`, `fflogs_player_fight_metrics`; used for FightContext and insights |
| **Report.graph** | Time-series (e.g. DPS over time) by fight/dataType/viewBy | Processed series | Report viewer; not yet fed to AI |
| **Report.rankings** | Parse/rank info per player per fight (percentiles, etc.) | GraphQL `JSON` | Report viewer; can enrich context for coaching |
| **Report.playerDetails** | Specs, talents, gear per player | GraphQL `JSON` | Report viewer; optional for gear-aware advice |
| **Report.masterData** | Actors, abilities referenced in the report | GraphQL `JSON` | Resolving names/IDs in tables and events |

These are **pre-aggregated** by FFLogs. We choose aggregation level (e.g. by Source, by Ability) and time window (fight or report); we do not receive raw event streams from the table/graph/rankings endpoints.

### 1.2 Raw / heavy data: Report.events

- **Report.events** is the only true **raw combat log** stream: damage, heals, deaths, auras, etc., with optional filters (e.g. `dataType`, `startTime`, `endTime`, `fightIDs`).
- It is **paginated**, “not frozen” (can be large), and subject to rate limits. Best used **selectively** (e.g. one fight, one dataType) and cached.
- **When to use**: Death timelines, ability-by-ability analysis, custom mechanics, or any reasoning that requires exact event order and timing. Not required for “coaching lite”, summaries, or parse-quality feedback.

### 1.3 Limits and relation to “player-relevant” questions

- **Table + rankings + fight list** are sufficient for: pull outcomes, who died, DPS/heal breakdown, parse quality, and high-level coaching. Our current **FightContext** (from normalized Supabase tables populated by import) already supports this.
- **Events** are needed only when we want: death timelines, GCD/ability-level reasoning, or custom mechanics. Cost and size suggest we add an **event-fetch tool** used only when the agent or user explicitly requests event-level analysis.

---

## 2. OpenAI Agents SDK: orchestration and tools

### 2.1 Patterns

- **Orchestrating via code**: Application logic controls which agent runs when (e.g. “summary” vs “coaching” vs “death timeline”).
- **Orchestrating via LLM**: A manager/triage agent decides steps and which specialist to call based on the user’s request.

Two multi-agent patterns are relevant:

1. **Agents as tools**: A manager agent calls specialist agents as tools (`agent.asTool()`). The manager owns the final answer and can combine outputs and enforce guardrails. Fits “one report, multiple analysis types” (summary + coaching + optional event deep-dive).
2. **Handoffs**: A triage agent routes to a specialist who becomes the active agent for that turn. Fits “user asks a question → route to summary / coaching / death-timeline specialist.”

These can be combined: e.g. triage handoff to a “report analyst” specialist that itself uses tools (fetch table, fetch events for fight X).

### 2.2 Tool design for FFLogs

- **Fetch report table** (by report code, optional fightIDs/dataType/viewBy): Returns aggregated table data; can mirror existing API route or Supabase normalized data.
- **Fetch report rankings** (by report code, optional fightIDs): Returns parse/percentile data for coaching.
- **Fetch events** (report code, fightID, optional dataType, page): Returns paginated raw events for death/ability-level analysis. Use sparingly and cache.
- **Get FightContext** (report code): Returns the existing serialized FightContext from Supabase (current behavior). Can remain the default context source so the agent does not need to call FFLogs on every request.

Agents can be configured with instructions, model, tools, handoffs, and guardrails. For Hydaelyn, starting with **orchestrating via code** (existing insight types: summary, briefing, coaching) and adding **one specialist + event tool** for “death timeline” or “ability-level” analysis keeps the implementation path clear.

---

## 3. Model choice

- **Summaries and briefings**: Prefer **gpt-4o** or **gpt-4o-mini** for speed and cost; context is structured (FightContext) and task is well-defined.
- **Coaching**: **gpt-4o** is a good default; for harder reasoning (e.g. “why did we wipe?”, “compare to top parses”), a **capable model** (e.g. **o1** or latest “five series” when available) can improve quality. Reserve heavier models for explicit “deep analysis” or “coaching” requests to control cost.
- **Event-level reasoning** (death timeline, ability order): Likely to need larger context (many events). **gpt-4o** with a summarized event window (e.g. 30s around deaths) is a practical first step; **o1** or a five-series model can be an option for full-fight event reasoning once token budgets and caching are validated.

**Token budgets**: FightContext is already bounded (we serialize a subset of fights/players). Events can be large; prefer **preprocessing** (filter by fight, dataType, time window) and **chunking** or **summaries** before sending to the model.

---

## 4. Implementation path

### 4.1 Current state

- **Insights route**: `apps/hydaelyn/app/api/reports/[code]/insights/route.ts` — POST with `type`: summary | briefing | coaching. Uses `buildReportContext` from normalized Supabase tables and `chatCompletion` (single LLM call). No agents SDK yet.
- **FightContext**: `apps/hydaelyn/lib/fflogs/fight-context.ts` — Builds `ReportContext` and per-fight `FightContext` from `fflogs_fights`, `fflogs_fight_summaries`, `fflogs_player_fight_metrics`. Serialized for the prompt.

### 4.2 Recommended next steps

**Phase A – Event fetch and context**

- Add an **event-fetch tool** (or API route) that, given report code + fightID (+ optional dataType), returns a bounded window of events (e.g. around deaths or full fight, capped rows). Cache results in Supabase or in-memory to avoid repeated FFLogs calls.
- Optionally extend **FightContext** (or a new “EventContext”) with a short **death timeline** per fight (time, source, target, ability) derived from events, so the current single-call insights can use it without full event payloads.

**Phase B – Specialist agent for death/event analysis**

- Introduce a **death-timeline** (or “event”) specialist: it has access to the event-fetch tool and is instructed to summarize deaths and suggest mitigations. Invoked either:
  - **Via code**: New insight type (e.g. `type: "deaths"`) that calls this specialist and returns its output; or
  - **Via handoff**: Triage agent that, when the user asks “why did we wipe?” or “death timeline”, handoffs to this specialist.

**Phase C – Agents SDK integration**

- Replace or wrap the current single `chatCompletion` flow with an **agent** that has tools: Get FightContext, Fetch report table, Fetch rankings, Fetch events (and optionally “generate summary”, “generate coaching” as sub-agents or internal steps). Keep the same API contract (POST with `type`, response with `content`, `model_used`, `cached`) so the frontend does not need to change.
- Add **guardrails**: no PII in logs, no raw tokens in responses, and optional output length limits.

**Phase D – Model routing**

- Route “summary” and “briefing” to gpt-4o-mini or gpt-4o; “coaching” and “deaths” to gpt-4o; optional “deep analysis” to o1 or five-series when available and when the user explicitly requests it. Make model choice configurable (e.g. env or feature flag) so we can A/B test.

### 4.3 Supabase and schema

- **report_insights**: Already stores `report_code`, `type`, `content`, `model_used`, `input_hash`. No schema change required for Phase A–B; optional later: `context_version` or `event_window` for caching event-based insights.
- **fflogs_*** tables: Already used for FightContext. Optional: a small **event_cache** or **death_timelines** table if we precompute and store event-derived summaries for faster agent context.

---

## 5. Summary

| Theme | Finding |
|-------|--------|
| **FFLogs data** | Table, graph, rankings, playerDetails are aggregated; only Report.events is raw. Table + rankings + fight list are enough for summaries and coaching; events are for death/ability-level analysis. |
| **Agents SDK** | Manager + specialists (as tools or handoffs); tools = fetch table, rankings, events, FightContext. Start with code-driven orchestration, then add LLM-driven triage if needed. |
| **Models** | gpt-4o-mini/gpt-4o for summary/briefing; gpt-4o for coaching; o1/five-series for optional deep analysis. Bound event context to avoid token overflow. |
| **Implementation** | Phase A: event fetch + optional death timeline in context. Phase B: death/event specialist. Phase C: Agents SDK with tools and same API contract. Phase D: model routing and guardrails. |

This gives a research-backed plan to use the OpenAI Agents SDK and capable models to analyze FFLogs in a player-relevant way, without implementing the full agent pipeline in the initial landing/health task.
