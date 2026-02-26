# Integrations Master

Single source of truth for parent programs and integrations across the MOOD MNKY ecosystem. Sourced from Notion Credentials databases; update this doc periodically as integrations change.

**Related:** [.env.master.example](.env.master.example) (env var layout); [docs/AGENT-APPS.md](docs/AGENT-APPS.md) (agent portals).

---

## Auth

| Integration | Current use | Potential use |
|-------------|-------------|----------------|
| **Notion** | MNKY MIND API key; n8n integration. Sync content, credentials hub. | Agent apps: knowledge base, config; docs sync. |
| **GitHub** | n8n credential for repo/API. | CODE MNKY: deploy, PRs, code review; agent apps: OAuth or token for repo access. |
| **Jellyfin** | API key for MOOD MNKY COMMAND (media). | Agent apps: media links or status if exposed. |

---

## Database & storage

| Integration | Current use | Potential use |
|-------------|-------------|----------------|
| **Supabase** | Primary DB, auth, storage (MNKY MIND S3-style keys). Profiles, agent_profiles, media_assets, etc. | All agent apps: shared auth, profile; MOOD/SAGE/CODE: agent-scoped tables (e.g. reflections, snippets) with profile_id. |

---

## Commerce

| Integration | Current use | Potential use |
|-------------|-------------|----------------|
| **Shopify (Hydrogen & Oxygen)** | Storefront, Admin API, customer account. Multiple credential entries for Hydrogen/Oxygen. | MOOD MNKY: product narrative, collections; agent apps: read-only product/catalog if needed. |

---

## AI

| Integration | Current use | Potential use |
|-------------|-------------|----------------|
| **OpenAI** | MOOD_MNKY agents; n8n. Chat, completions, voice. | All agents: chat/completions; CODE: code snippets; SAGE: guidance prompts. |
| **ElevenLabs** | Voice agents, TTS. | MOOD/SAGE/CODE portals: voice intro or demos. |
| **Brave** | n8n; search. | Research, RAG; agent apps: “search” tool. |
| **Tavily** | n8n; search. | Same as Brave; agent apps. |
| **LangSmith** | Tracing/observability. | All agents: trace quality and prompts. |
| **Hugging Face** | n8n. | Models, embeddings; LABZ or agent apps. |
| **Wolfram** | n8n. | Compute, data; CODE MNKY or LABZ. |

---

## Automation & scraping

| Integration | Current use | Potential use |
|-------------|-------------|----------------|
| **Firecrawl** | API key; n8n. Scraping, extraction. | Agent apps: ingest docs/URLs; research flows. |
| **n8n** | Workflows using Supabase, Notion, OpenAI, Brave, Tavily, etc. | Orchestrate agent-specific flows; sync Credentials to .env.master. |

---

## Other

| Integration | Current use | Potential use |
|-------------|-------------|----------------|
| **Google (Cloud)** | MNKY DOCS (e.g. API key). | Docs, search; agent apps if needed. |
| **Smithery** | DEV-MNKY. | Dev tooling; CODE MNKY. |

---

## Env var reference

See [.env.master.example](.env.master.example) for variable names by integration. Do not commit real secrets; keep them in Notion or local `.env`/`.env.local` and copy into `.env.master` only locally (gitignored).

---

## Maintenance

- **Source:** Notion Credentials hub and linked DBs (MOOD MNKY Credentials, n8n Credentials, n8n Credentials v2, Credentials (AI)). Re-export periodically and merge into this doc.
- **Agent roadmaps:** Each agent app’s `/roadmap` page references this list for integration diagrams.
