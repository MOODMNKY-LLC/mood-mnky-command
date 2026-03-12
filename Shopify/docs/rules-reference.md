# Rules Reference

All Cursor rules that apply to Shopify theme development in this project.

## Project-Wide Rules

| File | Scope | Purpose |
|------|-------|---------|
| [.cursorrules](../.cursorrules) | All theme work | Operating model, Shopify/Liquid conventions, assets, safety rails, workflow, testing checklist |

## Scoped Rules (.mdc)

| File | Globs | When Applied | Purpose |
|------|-------|--------------|---------|
| [shopify-liquid-basics.mdc](../.cursor/rules/shopify-liquid-basics.mdc) | `**/*.liquid` | Editing any Liquid file | Liquid fundamentals, Do/Don't, change protocol |
| [section-schema-safety.mdc](../.cursor/rules/section-schema-safety.mdc) | `sections/**/*.liquid` | Editing section files | Schema JSON rules, blocks, settings; prevent editor breakage |
| [assets-css-js-standards.mdc](../.cursor/rules/assets-css-js-standards.mdc) | `assets/**/*.{css,js,ts}` | Editing CSS/JS/TS in assets | CSS/JS standards, performance, progressive enhancement |
| [performance-accessibility.mdc](../.cursor/rules/performance-accessibility.mdc) | `**/*.{liquid,css,js,ts}` | Editing Liquid, CSS, JS, TS | Performance and accessibility guardrails |
| [deep-thinking.mdc](../.cursor/rules/deep-thinking.mdc) | — | When explicitly requested | Deep research protocol (Brave, Tavily, Sequential Thinking) |
| [mcp-tool-usage.mdc](../.cursor/rules/mcp-tool-usage.mdc) | — | Always | MCP tool usage guidelines including Shopify MCP |
| [documentation-and-techstack.mdc](../.cursor/rules/documentation-and-techstack.mdc) | — | Always | PRD and docs usage; tech stack compliance |
| [coding-best-practices.mdc](../.cursor/rules/coding-best-practices.mdc) | — | Always | General coding standards, UI safety |

## Rule Application Logic

- **Project-wide** (`.cursorrules`): Applies to all conversations in this repo when theme work is relevant.
- **Scoped by globs**: Rules with `globs` apply when files matching those patterns are in context (opened, edited, or referenced).
- **Always apply**: Rules with `alwaysApply: true` are included in every conversation.

## Shopify-Specific Rules Summary

| Rule | Key Points |
|------|------------|
| shopify-liquid-basics | Preserve control flow; use snippets for repeated markup; keep schema strict JSON |
| section-schema-safety | No trailing commas in schema; maintain stable setting IDs; don't remove blocks lightly |
| assets-css-js-standards | Extend existing patterns; avoid blocking scripts; progressive enhancement |
| performance-accessibility | Minimal DOM; responsive images; keyboard reachable; labels and focus styles |
