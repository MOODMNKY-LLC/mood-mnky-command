# CODE MNKY Control Panel & Flowise – Best Practices

Brief note driving implementation of the editable CODE MNKY panel and Flowise control panel.

## Compact control panel UX

- **Primary navigation:** Tabs (Model | Instructions | Tools | Integrations | Roadmap) so one section is visible at a time and vertical space is reduced.
- **Long lists:** Use Select (dropdown) for single choice (e.g. default model); ScrollArea with fixed max height (e.g. 200px) for "available models" or other long lists.
- **Long content:** ScrollArea around system prompt textarea and Agent/Tools block (e.g. max-h 40–50vh) to avoid endless scroll on the page.
- **Roadmap / grouped content:** Collapsible per section (default collapsed) so users expand only what they need.
- **Spacing:** Tighter gaps (gap-4) and padding; root design tokens only (see DESIGN-SYSTEM.md).

## Editable AI assistant config

- **Persistence:** Supabase table `code_mnky_config` (key-value: default_model, system_prompt_override, tool_overrides). Authenticated users can read/write via RLS.
- **Resolution:** Chat API reads config from DB; if no override for a key, fall back to code (LABZ_SYSTEM_PROMPT, LABZ_DEFAULT_MODEL). Default model from config must be in server allowlist.
- **Tool toggles:** Optional; store as JSON in tool_overrides and filter labzTools before passing to streamText (phase 2 if needed).

## Flowise API and SDK

- **Instance:** flowise-dev.moodmnky.com; API base path `/api/v1` (chatflows, prediction). Auth: Bearer token (FLOWISE_API_KEY).
- **Proxy:** All Flowise calls from Next.js API routes only; never from the browser. GET /api/flowise/chatflows → Flowise GET /api/v1/chatflows; POST /api/flowise/predict → Flowise POST /api/v1/prediction/:id.
- **SDK:** flowise-sdk (FlowiseClient, createPrediction) used server-side in proxy routes; baseUrl and auth headers from env. No key or chatflow IDs exposed to client.
