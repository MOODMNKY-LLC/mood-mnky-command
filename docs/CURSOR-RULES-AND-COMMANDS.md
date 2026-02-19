# Cursor Rules and Commands

This project uses Cursor **rules** and **commands** for consistent context and workflows. See [Cursor Rules](https://cursor.com/docs/context/rules) and [Cursor Commands](https://cursor.com/docs/context/commands) for full docs.

## Where things live

- **Rules:** `.cursor/rules/` — persistent context (project standards, Supabase, MCP, Liquid, Postgres, etc.). Applied always, by file pattern, or when relevant.
- **Commands:** `.cursor/commands/` — slash workflows (e.g. `/deploy`, `/pr`, `/code-review`, `/theme-research`, `/security-audit`). Type `/` in chat to see options; text after the command name is passed as context.
- **Skills:** `.cursor/skills/` — agent-decided or explicitly invoked (e.g. design, research, docs-lookup).
- **Agents (subagents):** `.cursor/agents/` — specialists (shopify, verse-storefront, labz, verifier, debugger). See [CURSOR-AGENTS.md](CURSOR-AGENTS.md).

Rules define *how* we write code and use tools; commands define *what* to do in a given workflow.
