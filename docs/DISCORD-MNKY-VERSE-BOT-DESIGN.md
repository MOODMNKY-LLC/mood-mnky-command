# MNKY VERSE Discord Bot — Design

This document defines the role, skillset, use cases, and slash commands for the MNKY VERSE Discord bot. It aligns with the existing MOOD, SAGE, and CODE bots and the server map in [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md).

## Role

**MNKY VERSE** is the **Verse concierge**: the single bot that helps members get to the MNKY VERSE (storefront), understand drops, quests, XP, rewards, and the Dojo, and that routes users to MOOD MNKY, SAGE MNKY, or CODE MNKY when appropriate.

- **In-scope:** What is the Verse; how to open the app; drops, quests, rewards, Dojo; gamification (XP, link Discord); short actionable answers and links.
- **Out-of-scope:** Long brand narratives (→ MOOD MNKY); deep learning/reflection (→ SAGE MNKY); tech implementation/LABZ (→ CODE MNKY).

## Skillset

- **Tone:** Aligned with MOOD MNKY’s refined, minimalist voice for product-facing copy; concise and actionable in Discord.
- **Content:** Short replies; always include the relevant app link (`/verse`, `/verse/drops`, `/verse/quests`, `/verse/rewards`, Dojo).
- **Gamification:** Explain quests, XP, and “link Discord” in one or two sentences; point to the app for details.
- **Hand-offs:** Suggest “Ask MOOD MNKY for scent and brand stories,” “Ask SAGE MNKY for learning and reflection,” “Ask CODE MNKY for dev and LABZ” when the question clearly fits another agent.

## Use cases

| Use case | Description |
|----------|-------------|
| What is Verse? | User wants to know what MNKY VERSE is and how to get there. |
| Drops | User wants to know about current drops or seasonal releases; link to `/verse/drops`. |
| Quests | User wants to know how quests work or how to complete them; link to `/verse/quests`. |
| Rewards | User wants to see or redeem rewards; link to `/verse/rewards`. |
| Dojo | User wants community hub, learning, or “Dojo”; link to Dojo / Verse community. |
| XP / level | User asks about XP or level; short explanation + link to Verse. |
| Free-form ask | Any other Verse-related question; answered by the concierge (agent-reply with slug `mnky_verse`). |

## Slash commands

| Command | Options | Behavior |
|---------|---------|----------|
| `verse` | — | What is MNKY VERSE + app link. |
| `drops` | `topic` (optional string) | Current drops + link to `/verse/drops`. |
| `quests` | `topic` (optional string) | How quests work + link to `/verse/quests`. |
| `rewards` | — | Rewards catalog + link to `/verse/rewards`. |
| `dojo` | `topic` (optional string) | Dojo/community + link. |
| `ask` | `question` (required string) | Free-form question → agent-reply with `agentSlug: "mnky_verse"`. |

All commands:

- Emit events to `POST /api/discord/events` (eventRef e.g. `slash:verse`, `slash:ask`).
- Use profile resolve (`GET /api/discord/profile-by-discord-id`) when available for gamification.
- Respect rate limiting via shared Redis (same as other bots).

## Relationship to other bots

- **MOOD MNKY:** Brand, fragrance, vibe, scent stories. MNKY VERSE bot defers to MOOD for “what’s this scent?” or “tell me about the brand.”
- **SAGE MNKY:** Learning, reflection, Dojo depth. MNKY VERSE bot gives the Dojo link and short blurb; suggests SAGE for “I want to reflect” or “learning path.”
- **CODE MNKY:** Tech, LABZ, deploy, PR. MNKY VERSE bot points to CODE for “how do I use LABZ?” or “deploy help.”

## Server map context

- **MNKY VERSE** category is currently empty; suggested channels: #drops, #verse-blog, #quests, #dojo (see [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md)).
- **MNKY AGENTS** holds mood/sage/code channels; the MNKY VERSE bot is the fourth agent and can be referenced in onboarding (e.g. “Use /verse for the storefront and quests”).
- **MNKY SHOP** (rewards, orders) aligns with the `/rewards` command and rewards catalog link.

## System instructions (agent_profiles)

The `mnky_verse` row in `agent_profiles` should use system instructions that:

1. State the bot is the MNKY VERSE concierge: storefront, drops, quests, rewards, Dojo.
2. Require short, actionable replies and include the relevant app link when answering about Verse, drops, quests, rewards, or Dojo.
3. Tell the bot to suggest MOOD MNKY for brand/scent, SAGE MNKY for learning/reflection, CODE MNKY for tech/LABZ when the question fits.
4. Use the same language rule as other agents (English only; politely redirect other languages).

## References

- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Categories and channels.
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Events API, agent bots, gamification.
- [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md) — Quests, XP, Discord events.
