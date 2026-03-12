# MCP Setup

This document describes the MCP (Model Context Protocol) servers configured for Shopify theme development and how to set them up.

## Configured Servers

### Shopify MCP (Built-in)

Provided by Cursor. No `mcp.json` entry required.

- **Tools**: `learn_shopify_api`, `search_docs_chunks`, `validate_theme`, `validate_component_codeblocks`, `validate_graphql_codeblocks`, `fetch_full_docs`
- **Use**: Theme validation, Shopify docs search, Liquid/schema validation

### Research Servers (Theme Development + Deep-Thinking)

| Server | Purpose | API Key |
|--------|---------|---------|
| brave-search | Broad context, citations (max_results=20) | `BRAVE_API_KEY` |
| tavily | Deep dives (search_depth=advanced) | `TAVILY_API_KEY` |
| sequential-thinking | Multi-step analysis, hypothesis testing | None |
| firecrawl | Extract content from Shopify docs, theme URLs | `FIRECRAWL_API_KEY` |
| fetch | Simple URL fetch (no processing) | None |

### Other Servers

| Server | Purpose |
|--------|---------|
| filesystem | File operations (mounts project directory) |
| supabase-local | Local Supabase database (dev) |
| supabase-prod | Production Supabase |
| shadcn | shadcn/ui components |
| wolfram-alpha | Wolfram Alpha queries |
| openaiDeveloperDocs | OpenAI docs |
| memory | Persistent memory |
| mcp-discord | Discord integration |
| n8n-dev-mcp | n8n workflow automation |

## Environment Variables

Add the following to a `.env` file (gitignored) in the project root or your user environment:

```env
# Research MCPs (for deep-thinking and theme research)
BRAVE_API_KEY=your_brave_api_key
TAVILY_API_KEY=your_tavily_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### Obtaining API Keys

- **Brave Search**: https://brave.com/search/api/
- **Tavily**: https://tavily.com/
- **FireCrawl**: https://firecrawl.dev/

Ensure Cursor can read these variables. Options:
- Place `.env` in project root (if Cursor loads it)
- Set them in your shell profile (e.g. `.bashrc`, `.zshrc`, Windows Environment Variables)
- Use Cursor's environment configuration if supported

## Filesystem MCP Path Notes

The `filesystem` server mounts `C:/DEV-MNKY` to `/local-directory` inside the container. For this Shopify workspace:

- **Workspace root**: `C:\DEV-MNKY\Shopify`
- **Theme path**: `Shopify/theme/` (Skeleton theme)
- **Inside MCP**: Paths are relative to `/local-directory` (e.g. `Shopify/sections/header.liquid`)

If your theme lives in a subdirectory (e.g. `Shopify/dawn/`), use that path when calling `validate_theme` or other tools that accept theme paths.

## Docker Requirements

The following servers run via Docker:

- brave-search
- tavily
- sequential-thinking
- firecrawl
- fetch
- filesystem
- wolfram-alpha
- memory
- mcp-discord
- n8n-dev-mcp

Ensure Docker is running and the `mcp/*` images are available. Pull images if needed:

```bash
docker pull mcp/brave-search
docker pull mcp/tavily
docker pull mcp/sequentialthinking
docker pull mcp/firecrawl
docker pull mcp/fetch
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "BRAVE_API_KEY not set" | Add key to `.env` or environment; restart Cursor |
| "Docker not running" | Start Docker Desktop or Docker daemon |
| "Image not found" | Run `docker pull mcp/<server-name>` |
| validate_theme fails | Ensure theme path is correct; check that theme has valid structure (layout/, sections/, snippets/, etc.) |

## References

- MCP config: [.cursor/mcp.json](../.cursor/mcp.json)
- MCP tool usage: [.cursor/rules/mcp-tool-usage.mdc](../.cursor/rules/mcp-tool-usage.mdc)
- Cursor MCP docs: https://cursor.com/docs/context/model-context-protocol
