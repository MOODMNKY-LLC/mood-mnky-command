# .cursor — Cursor IDE customization

This directory holds project-level context and workflows for Cursor’s AI agent.

| Layer | Purpose | Path |
|-------|---------|------|
| **Rules** | Static or file-scoped context; guardrails and conventions | [rules/](rules/) |
| **Agents** | Custom subagents (specialists) | [agents/](agents/) |
| **Commands** | Slash-invoked workflows (e.g. `/pr`, `/code-review`, `/discord-refresh-map`, `/discord-plan`) | [commands/](commands/) |
| **Skills** | Dynamic context; domain workflows; optional `/` invocation (e.g. design, discord-agent) | [skills/](skills/) |

For details, see:

- [docs/CURSOR-RULES-AND-COMMANDS.md](../docs/CURSOR-RULES-AND-COMMANDS.md) — rules, commands, skills
- [docs/CURSOR-AGENTS.md](../docs/CURSOR-AGENTS.md) — subagents and when to use them
