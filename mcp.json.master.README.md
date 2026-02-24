# MCP master config and secrets reference

Unified MCP server list lives in **`mcp.json.master`** at the repo root. Use it as a reference or copy subsets into `.cursor/mcp.json`.

## How to use

- **Secrets** are referenced in the JSON as `${env:VAR_NAME}`. Cursor reads these from your environment (e.g. `.env` or `.env.local` at repo root). **Do not put literal API keys or tokens in the master file.**
- To enable a subset of servers: copy `mcp.json.master` to `.cursor/mcp.json` and remove any `mcpServers` entries you don’t want, or start from `.cursor/mcp.json.example` and add servers from the master.
- Ensure required env vars are set in `.env` / `.env.local` for any server you enable (see below).

## Servers in `mcp.json.master` (no secrets)

| Server | Description |
|--------|-------------|
| `moodmnky-docs` | MOOD MNKY docs (HTTP). |
| `filesystem` | Docker filesystem; path `C:/DEV-MNKY`. |
| `supabase-local` | Local Supabase MCP at `http://127.0.0.1:54321/mcp`. |
| `shadcn` | shadcn/ui MCP (npx). |
| `@magicuidesign/mcp` | Magic UI Design (npx). |
| `openaiDeveloperDocs` | OpenAI developer docs (HTTP). |
| `memory` | Docker memory server. |
| `fetch` | Simple URL fetch (Docker). |
| `sequential-thinking` | Sequential thinking (Docker). |
| `Notion` | Notion OAuth (HTTP); auth via Cursor. |
| `notion-sse` | Notion SSE. |
| `notion-stdio` | Notion via mcp-remote. |
| `shopify-dev-mcp` | Shopify Dev MCP (npx); auth per session. |

## Servers that require secrets (env vars)

Set these in `.env` or `.env.local` (repo root). Same vars are documented in `.env.example`.

| Server | Env variable(s) | Notes |
|--------|------------------|--------|
| `wolfram-alpha` | `WOLFRAM_API_KEY` | Wolfram Alpha API key. |
| `mnky-verse-discord` | `DISCORD_BOT_TOKEN_MNKY_VERSE` | Discord bot token (MNKY VERSE). |
| `n8n-dev-mcp` | `N8N_API_URL`, `N8N_API_KEY` | n8n base URL and API key (e.g. JWT). |
| `@21st-dev/magic` | `MAGIC_21ST_API_KEY` | 21st.dev Magic; get at https://21st.dev/magic/console. |
| `firecrawl` | `FIRECRAWL_API_KEY` | FireCrawl API key. |
| `brave-search` | `BRAVE_API_KEY` | Brave Search API key. |
| `tavily` | `TAVILY_API_KEY` | Tavily API key. |
| `github` | `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub PAT for repo/PR/issue operations. |
| `notion-open-source` | `NOTION_API_KEY`, `NOTION_API_VERSION` | Fallback when not using Notion OAuth. |

## Security

- **Never commit literal secrets** into `mcp.json.master` or `.cursor/mcp.json`. Always use `${env:VAR_NAME}` and keep values in `.env` / `.env.local` (gitignored).
- If your current `.cursor/mcp.json` contains hardcoded keys (e.g. Wolfram or n8n), replace them with the env references above and set the vars in `.env.local`.

## Source of truth

- **Config:** `.cursor/mcp.json` (active), `mcp.json.master` (unified reference), `.cursor/mcp.json.example` (template).
- **Secrets / env:** `.env.example` (list of vars), `.env` / `.env.local` (actual values, gitignored).
- **Usage:** `.cursor/rules/mcp-tool-usage.mdc`.
