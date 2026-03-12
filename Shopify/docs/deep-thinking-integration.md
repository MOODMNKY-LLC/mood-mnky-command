# Deep Thinking Integration

This document explains when and how to use the deep-thinking protocol for Shopify theme development, and how it differs from standard implementation workflows.

## What Is Deep Thinking?

The deep-thinking protocol (`.cursor/rules/deep-thinking.mdc`) is a structured research process that uses:

- **Brave Search**: Broad context gathering (max_results=20)
- **Tavily Search**: Deep dives (search_depth=advanced)
- **Sequential Thinking**: Multi-step analysis, hypothesis testing, pattern extraction
- **FireCrawl**: Content extraction from specific URLs when needed

It follows three stop points:

1. **Initial engagement**: Ask 2–3 clarifying questions; wait for response
2. **Research planning**: Present 3–5 themes, execution plan; wait for approval
3. **Mandated research cycles**: Run full cycles per theme (no stops until complete)
4. **Final report**: Knowledge development, comprehensive analysis, practical implications

## When to Use Deep Thinking vs. Implementation

| Scenario | Use Deep Thinking? | Use Standard Workflow? |
|----------|-------------------|------------------------|
| Add a section setting | No | Yes — `/add-section-setting` |
| Fix a layout bug | No | Yes — `/fix-theme-bug` |
| Extract repeated markup | No | Yes — `/liquid-snippet-extract` |
| Choose theme architecture (Dawn vs custom) | Yes | Plan after research |
| Migrate from Theme Kit to CLI 3.x | Yes | Plan after research |
| Optimize performance at scale (LCP, CLS) | Yes | Plan after research |
| Evaluate third-party cart/checkout solutions | Yes | Plan after research |
| Add a simple CSS tweak | No | Yes — direct edit |

## How to Invoke

### Option 1: Custom Command

Run `/theme-research-plan` in chat. This prompts the agent to invoke the deep-thinking protocol for complex theme decisions.

### Option 2: Explicit Request

Ask: "Use the deep-thinking protocol to research [topic]." The agent will follow `.cursor/rules/deep-thinking.mdc`.

### Option 3: Reference the Rule

Mention: "Follow deep-thinking.mdc for this research."

## Research vs. Implementation

**Research** (deep-thinking): Exhaustive investigation, multiple sources, evidence chains, contradictions, limitations. Output is a narrative report, not code.

**Implementation** (standard workflow): Plan → Code → Validate → Test. Uses `/theme-change-plan`, commands, and Shopify MCP for validation.

Use deep-thinking **before** implementation when the decision has broad impact and insufficient prior knowledge. Use the standard workflow for well-understood, localized changes.

## Integration with Theme Workflow

1. **Identify complexity**: Is this a one-off edit or a strategic decision?
2. **If strategic**: Run `/theme-research-plan` → Get final report → Use findings to inform `/theme-change-plan` → Implement.
3. **If localized**: Run `/theme-change-plan` → Implement → `/performance-pass` + `/accessibility-pass`.

## Requirements

- Research MCPs must be configured: brave-search, tavily, sequential-thinking, firecrawl (optional but useful).
- API keys: `BRAVE_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY` (see [mcp-setup.md](mcp-setup.md)).

## References

- Protocol definition: [.cursor/rules/deep-thinking.mdc](../.cursor/rules/deep-thinking.mdc)
- Command: [.cursor/commands/theme-research-plan.md](../.cursor/commands/theme-research-plan.md)
