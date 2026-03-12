# Credentials — Notion Source Mapping

**Source:** Notion → Credentials page → MOOD MNKY Credentials database  
**URL:** https://www.notion.so/6f2a478a094342d59c80e03eb6c2a5ef

This document maps MNKY agent credentials from the Notion database to `.env` variables used by mood-mnky-command.

---

## MNKY MIND / MNKY VERSE (Notion API)

| Env Variable    | Notion Entry      | Use Cases       | Use in App                          |
|----------------|-------------------|-----------------|-------------------------------------|
| `NOTION_API_KEY` | **Notion** (Parent Program) | MNKY MIND API KEY | lib/notion.ts, seed scripts (e.g. `pnpm notion:seed-mnky-scenes`), sync APIs, blog sync |

**Key format:** `ntn_...` (Notion Bearer token)  
**Notion page:** https://www.notion.so/2e1cd2a654228078a2add0ff12e0d5cd

---

## MOOD MNKY

| Env Variable       | Notion Entry | Use Cases | Use in App                |
|--------------------|--------------|-----------|---------------------------|
| `OPENAI_API_KEY`   | **OpenAI**   | MOOD_MNKY | Chat, AI-SQL, image gen   |
| `OPENAI_ORG_ID`    | **OpenAI**   | (Text)    | Optional org scoping      |

**Notion page:** https://www.notion.so/84269226bc9243239d396e34b8cef091  

*Note: Current .env may use a different OpenAI key (e.g. Supabase Studio). MOOD MNKY key is the primary agent key from Notion.*

---

## SAGE MNKY

SAGE MNKY does not have a dedicated API key in the app env. Credentials in Notion include:

- **SAGE-SSH:** SSH key for SAGE MNKY server access
- **Discord-AI-Bot (SAGE-MNKY):** Bot token for Discord integration
- **Flowise:** SAGE may use Flowise chatflows; `FLOWISE_API_KEY` and `NEXT_PUBLIC_FLOWISE_*` apply

No additional app env vars required for SAGE MNKY unless integrating Discord or a separate SAGE API.

---

## CODE MNKY

| Env Variable  | Notion Entry | Use Cases         | Use in App                                      |
|---------------|-------------|-------------------|-------------------------------------------------|
| `N8N_API_KEY` | **N8N**     | CODE MNKY API KEY | n8n workflow calls, image batch automation      |
| `N8N_API_URL` | (Credentials page embed) | — | Base URL for n8n (e.g. http://10.3.0.113:5678) |

**Notion page:** https://www.notion.so/280cd2a6542280f59438e5b8b452fc08

**Notion also has:** Notion "CODE MNKY API KEY" (different: `ntn_...` for Notion MCP/Codex). The N8N key is for n8n automation.

---

## MCP / Research (Tavily, Brave, Firecrawl)

Used by Cursor MCP servers and docs/scripts (e.g. mcp-setup.md, deep-thinking).

| Env Variable       | Notion Entry       | Use Cases | Use in App / MCP              |
|--------------------|--------------------|-----------|-------------------------------|
| `TAVILY_API_KEY`   | **Tavily**         | API Key   | Tavily MCP, deep research     |
| `BRAVE_API_KEY`    | **Brave Search API** | API KEY | Brave Search MCP, citations   |
| `FIRECRAWL_API_KEY`| **Firecrawl**      | API Key   | Firecrawl MCP, web extraction |

**Notion pages:**  
- Tavily: https://www.notion.so/1b4cd2a654228056b181db17ff93f61d  
- Brave: https://www.notion.so/1aecd2a6542280dbaff0fa3700086e9b  
- Firecrawl: https://www.notion.so/1b8cd2a6542280ff94ecd85001b51cfa

---

## Summary: Which Key for What

| Purpose                    | Use                                |
|----------------------------|------------------------------------|
| Notion sync, blog, docs    | `NOTION_API_KEY` (MNKY MIND)       |
| AI Chat, images, AI-SQL    | `OPENAI_API_KEY` (MOOD MNKY)       |
| n8n automation, batch jobs | `N8N_API_KEY` (CODE MNKY)          |
| MCP search / research      | `TAVILY_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY` |

---

## Running the Seed Script

The VERSE blog seed script requires `NOTION_API_KEY`:

```bash
pnpm verse:seed-blog
```

Ensure `NOTION_API_KEY` is set in `.env` or `.env.local` (MNKY MIND key from Notion).
