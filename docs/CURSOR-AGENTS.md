# Cursor Subagents

This project defines **custom subagents** in `.cursor/agents/` so Cursor’s Agent can delegate context-heavy or domain-specific work to specialists. Each subagent runs in its own context window and returns a summary.

See [Cursor Subagents](https://cursor.com/docs/context/subagents) for how subagents work and when they are used vs skills.

---

## Subagents

| Name | Purpose | Invoke |
| --- | --- | --- |
| **shopify** | Theme (Liquid), Admin API, app extension, MNKY LABZ page creation, menu updates | `/shopify` or describe a Shopify/theme/MNKY LABZ-page task |
| **verse-storefront** | Public Verse routes, iframe-embedded pages, CSP/frame-ancestors, storefront UX | `/verse-storefront` or describe a Verse/store embed task |
| **labz** | MNKY LABZ dashboard, Supabase-backed data (fragrance oils, notes, formulas), MNKY LABZ APIs, Blending/glossary/formulas UI | `/labz` or describe a dashboard MNKY LABZ or data task |
| **verifier** | Validate that completed work is implemented and working; run tests and check edge cases | `/verifier` or ask to verify the last change |
| **debugger** | Root cause and minimal fix for errors and test failures | `/debugger` or paste an error and ask to debug |
| **mood-mnky** | Brand ambassador; brand voice, copy, product narrative, aesthetic guidance | `/mood-mnky` or ask for brand-facing copy or tone |
| **sage-mnky** | Wisdom-focused advisor; reflection on architecture, product direction, process, trade-offs | `/sage-mnky` or ask for guidance or a sounding board |
| **code-mnky** | DevOps and coding companion; implementation, commands, step-by-step technical guidance | `/code-mnky` or ask for implementation or DevOps help |
| **discord-agent** | Discord specialist; bots, server map, onboarding, slash commands; orchestrates Discord MCP, API docs, Supabase, Notion; keeps Discord docs updated | `/discord-agent` or describe a Discord/bot/onboarding task |
| **docs** | Documentation and Mintlify specialist; mnky-docs, docs/, technical writing | `/docs` or ask to create or edit documentation |

---

## How to use

- **Explicit:** In Agent chat, type `/name` and the task (e.g. `/verifier confirm the MNKY LABZ page creation flow`, `/shopify add a new theme template for the glossary page`).
- **Automatic:** Agent may delegate to a subagent when the task matches the description (e.g. “fix the theme dropdown menu” → shopify; “make the fragrance wheel embeddable” → verse-storefront).

---

## Files

- `.cursor/agents/shopify.md` — Shopify specialist
- `.cursor/agents/verse-storefront.md` — Verse/storefront specialist
- `.cursor/agents/labz.md` — MNKY LABZ dashboard and data specialist
- `.cursor/agents/verifier.md` — Verification specialist
- `.cursor/agents/debugger.md` — Debugging specialist
- `.cursor/agents/mood-mnky.md` — MOOD MNKY brand ambassador
- `.cursor/agents/sage-mnky.md` — SAGE MNKY advisor
- `.cursor/agents/code-mnky.md` — CODE MNKY coding companion
- `.cursor/agents/discord-agent.md` — Discord specialist (bots, server map, onboarding, integration)
- `.cursor/agents/docs.md` — Documentation and Mintlify specialist

Edit the `description` field in each file’s YAML frontmatter to tune when Agent delegates. Keep prompts concise and focused.
