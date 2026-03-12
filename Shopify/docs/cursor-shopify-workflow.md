# Cursor Shopify Theme Workflow

This document describes the end-to-end workflow for developing Shopify themes in Cursor using project rules, custom commands, and MCP servers.

## Workflow Overview

```
Request → Plan → Implement → Validate → Test
```

1. **Request**: User describes the change (new feature, bug fix, refactor).
2. **Plan**: Run `/theme-change-plan` to get a safe implementation plan.
3. **Implement**: Edit code with agent assistance; use commands as needed.
4. **Validate**: Run Shopify `validate_theme` (via MCP) on modified files.
5. **Test**: Manual verification per checklist (header, product, cart, editor).

## Step-by-Step Workflow

### 1. Start a Change Request

Describe what you want to do in chat. Be specific about:
- Which templates/sections/snippets are involved
- Whether it touches product, cart, or header (high-impact areas)
- Any constraints (e.g. preserve existing settings, no new dependencies)

### 2. Create a Plan

Run `/theme-change-plan` to get:
- Goal statement
- Proposed approach
- Files likely to change
- Risks and regressions to watch
- Tailored manual test checklist

**For complex decisions** (migration, performance strategy, architecture), run `/theme-research-plan` to invoke the deep-thinking protocol (Brave → Sequential Thinking → Tavily → Final Report).

### 3. Implement with Commands

| Task | Command | When |
|------|---------|------|
| Extract repeated markup | `/liquid-snippet-extract` | When you see duplicated Liquid/HTML |
| Add section setting | `/add-section-setting` | When adding a new configurable option |
| Fix a bug | `/fix-theme-bug` | When debugging a specific issue |
| Performance pass | `/performance-pass` | After implementation, before shipping |
| Accessibility pass | `/accessibility-pass` | After implementation, before shipping |

### 4. Validate Theme Files

After modifying Liquid, schema, or theme structure:
- Use the Shopify MCP `validate_theme` tool with theme path `theme/` (or full path to theme directory) and modified files.
- Fix any reported issues (invalid JSON, hallucinated Liquid, incorrect references).

### 5. Manual Testing

Use the checklist from your plan. At minimum:
- **Header**: Mobile menu, search, cart icon
- **Product**: Variants, add-to-cart, quantity selector
- **Cart**: Update quantity, remove items, notes (if present)
- **Performance**: No heavy blocking JS added
- **Theme editor**: Section settings visible and functional

### 6. Shopify CLI Verification

```bash
shopify theme dev
```

Preview changes in the browser. Run `shopify theme check` for linting.

## Integration with MCP

- **Shopify MCP**: `learn_shopify_api`, `search_docs_chunks`, `validate_theme` — use for docs and validation.
- **Research MCPs**: Brave, Tavily, FireCrawl, Sequential Thinking — use via `/theme-research-plan` or when researching best practices.
- **Fetch**: Use for quick URL retrieval when you have a specific docs link.

## Rules That Apply

When you edit Liquid files, these scoped rules activate:
- `shopify-liquid-basics.mdc` — Liquid fundamentals
- `section-schema-safety.mdc` — Schema integrity (for `sections/`)
- `assets-css-js-standards.mdc` — CSS/JS standards (for `assets/`)
- `performance-accessibility.mdc` — Perf and a11y guardrails

## Best Practices

- Always plan before coding. Use `/theme-change-plan` for non-trivial changes.
- Prefer minimal, reversible edits. Avoid touching `layout/theme.liquid` unless necessary.
- Keep `{% schema %}` valid JSON. Never add trailing commas.
- Run `/performance-pass` and `/accessibility-pass` before considering work complete.
- For complex research, use `/theme-research-plan` instead of ad-hoc search.
