
# MNKY-REPO Full Tech Stack

This document outlines the full technology stack powering the MNKY-REPO, spanning frontend frameworks, backend services, AI infrastructure, and developer tooling.

---

## 1ï¸âƒ£ Core Frameworks & Languages

| Category            | Stack                                      |
|---------------------|---------------------------------------------|
| **Frontend**        | Next.js 15 (App Router)                     |
| **Language**        | TypeScript, MDX, Markdown                   |
| **Styling**         | Tailwind CSS, ShadCN UI, custom fonts       |
| **Static Site Gen** | Mintlify Docs, MDX, Notion API (optional)   |

---

## 2ï¸âƒ£ Backend & Database

| Category               | Stack                                                |
|------------------------|------------------------------------------------------|
| **Database**           | PostgreSQL (Supabase)                                |
| **ORM/Query**          | Supabase client libraries (JS/TS)                    |
| **Auth**               | Supabase Auth with `@supabase/ssr`                   |
| **RLS**                | Supabase Row Level Security (RLS)                    |
| **Edge Functions**     | Supabase Edge Functions (Deno)                       |
| **Migrations**         | SQL-based migrations (manual/CLI)                    |
| **Stored Functions**   | Supabase SQL procedures                              |

---

## 3ï¸âƒ£ Tooling & Dev Experience

| Category              | Stack                                                  |
|-----------------------|--------------------------------------------------------|
| **Monorepo Tooling**  | Turborepo (`turbo.json`)                               |
| **Package Manager**   | pnpm (`pnpm-workspace.yaml`)                           |
| **Linting/Format**    | ESLint, Prettier, shared config in `packages/`         |
| **Editor Integration**| Cursor IDE (`.cursorrules`, `.vscode`)                 |
| **Diagrams**          | Mermaid.js for architecture visualization              |
| **Scripts**           | Utility scripts (`scripts/`)                           |

---

## 4ï¸âƒ£ Infrastructure & Hosting

| Category               | Stack                                                  |
|------------------------|--------------------------------------------------------|
| **Virtualization**     | Proxmox (self-hosting Supabase)                        |
| **Containerization**   | Docker                                                 |
| **Deployment Targets** | Supabase (hosted or local), Flowise server, Mintlify   |

---

## 5ï¸âƒ£ AI & Agent Frameworks

| Category             | Stack                                                    |
|----------------------|----------------------------------------------------------|
| **Remote AI Models** | OpenAI GPT-4o, GPT-4-turbo, GPT-3.5-turbo                |
| **Local AI Models**  | Ollama                                                   |
| **Agent Framework**  | OpenAI Agents SDK (Python)                               |
| **AI Pipelines**     | Flowise, LangChain                                       |
| **Prompt Storage**   | `agent-context/`, `chat-gpt-chats/`, `.cursorrules`      |
| **Agents**           | CODE MNKY, MOOD MNKY, SAGE MNKY                          |
| **Schemas**          | `agent-schema-reference.mdx`, JSON/YAML memory templates|

---

## 6ï¸âƒ£ Automation & Workflows

| Category              | Stack                                                  |
|-----------------------|--------------------------------------------------------|
| **Workflow Automation** | n8n (`n8n-openapi.yml`)                              |
| **AI Pipelines**       | Flowise (https://flowise-dev.moodmnky.com)            |
| **Task Runners**       | Turborepo, custom shell scripts                        |
| **Secrets Management** | `.env.local`, n8n secrets, Supabase config vars       |

---

## 7ï¸âƒ£ API Integrations

| Category             | Stack                                                       |
|----------------------|-------------------------------------------------------------|
| **Supabase SDK**     | `@supabase/supabase-js`, `@supabase/ssr`                    |
| **Shopify**          | REST & GraphQL API                                          |
| **Notion API**       | Internal token (`CODE_MNKY_NOTION_TOKEN`)                  |
| **Discord API**      | OAuth + interactions via `discord-openapi.json`             |
| **GitHub API**       | API access via `github-openapi.json`                        |
| **Flowise API**      | SDK + HTTP access                                           |
| **LangSmith**        | Tracing/testing LangChain flows                             |
| **DIM-API**          | Destiny Item Manager sync                                  |
| **Bungie API**       | Destiny 2 integrations                                      |

---

## 8ï¸âƒ£ Documentation & Knowledge Systems

| Category           | Stack                                                        |
|--------------------|--------------------------------------------------------------|
| **Main Docs UI**   | Mintlify Docs (`MOOD_MNKY_DOC_SITE_STRUCTURE/`)             |
| **CMS**            | Notion API                                                   |
| **Internal Docs**  | Markdown + MDX in `docs/`, `README.md`, `PRD.md`, etc.       |
| **Auto Gen**       | Planned auto-generation via Cursor + `.cursorrules`          |

---

## 9ï¸âƒ£ Developer Utilities

| Category               | Stack                                                  |
|------------------------|--------------------------------------------------------|
| **Encoding/Tests**     | `temp_base64.txt`, `cert_for_encoding.txt`             |
| **PR Templates**       | `PR-TEMPLATE.md`                                       |
| **Docs QA**            | `DOCUMENTATION-CHECKLIST.md`, `DOCUMENTATION-AUDIT.md`|
| **Planning Docs**      | `MOOD-MNKY-PRD.md`, `TODO-AI.md`                        |

---

## âœ… Summary Table

| Domain            | Technologies |
|------------------|--------------|
| **Frontend**      | Next.js, TypeScript, Tailwind, ShadCN |
| **Backend**       | Supabase, PostgreSQL, Edge Functions   |
| **AI/Agents**     | OpenAI, Ollama, LangChain, Flowise, Agents SDK |
| **Automation**    | n8n, Flowise, Turborepo, Scripts        |
| **Infrastructure**| Docker, Proxmox, Supabase (self/hosted) |
| **Docs**          | Mintlify, Notion, Markdown              |
| **DevOps**        | pnpm, Turborepo, Cursor IDE             |
| **APIs**          | Notion, GitHub, Discord, Bungie, Shopify, Flowise |

---