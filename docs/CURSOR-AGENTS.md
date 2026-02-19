# Cursor Subagents

This project defines **custom subagents** in `.cursor/agents/` so Cursor’s Agent can delegate context-heavy or domain-specific work to specialists. Each subagent runs in its own context window and returns a summary.

See [Cursor Subagents](https://cursor.com/docs/context/subagents) for how subagents work and when they are used vs skills.

---

## Subagents

| Name | Purpose | Invoke |
| --- | --- | --- |
| **shopify** | Theme (Liquid), Admin API, app extension, LABZ page creation, menu updates | `/shopify` or describe a Shopify/theme/LABZ-page task |
| **verse-storefront** | Public Verse routes, iframe-embedded pages, CSP/frame-ancestors, storefront UX | `/verse-storefront` or describe a Verse/store embed task |
| **labz** | Dashboard LABZ, Supabase-backed data (fragrance oils, notes, formulas), LABZ APIs, Blending/glossary/formulas UI | `/labz` or describe a dashboard LABZ or data task |
| **verifier** | Validate that completed work is implemented and working; run tests and check edge cases | `/verifier` or ask to verify the last change |
| **debugger** | Root cause and minimal fix for errors and test failures | `/debugger` or paste an error and ask to debug |

---

## How to use

- **Explicit:** In Agent chat, type `/name` and the task (e.g. `/verifier confirm the LABZ page creation flow`, `/shopify add a new theme template for the glossary page`).
- **Automatic:** Agent may delegate to a subagent when the task matches the description (e.g. “fix the theme dropdown menu” → shopify; “make the fragrance wheel embeddable” → verse-storefront).

---

## Files

- `.cursor/agents/shopify.md` — Shopify specialist
- `.cursor/agents/verse-storefront.md` — Verse/storefront specialist
- `.cursor/agents/labz.md` — LABZ dashboard and data specialist
- `.cursor/agents/verifier.md` — Verification specialist
- `.cursor/agents/debugger.md` — Debugging specialist

Edit the `description` field in each file’s YAML frontmatter to tune when Agent delegates. Keep prompts concise and focused.
