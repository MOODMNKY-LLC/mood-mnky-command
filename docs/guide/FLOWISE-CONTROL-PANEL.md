# Flowise Control Panel

The Flowise control panel is a full CRUD dashboard for the hosted Flowise instance. You can list and manage chatflows, variables, and tools, run test predictions, and read a short how-to guide. All calls to Flowise are made **server-side only**; the browser never talks to Flowise directly, so API keys and chatflow IDs stay secure.

## Where to find it

**Platform → Flowise** in the sidebar (under the Platform section). The instance is configured by `FLOWISE_BASE_URL` (default: `https://flowise-dev.moodmnky.com`).

## What it does

The page is organized into five tabs:

- **Chatflows** – List all chatflows in a table (name, id, type, deployed status). Create new chatflows, edit name/type/deployed/public and optionally flowData (JSON), view details, run a quick Test, or delete. Row actions: View, Edit, Test, Delete.
- **Variables** – List instance-level variables (name, value, type). Add, edit, and delete variables.
- **Tools** – List custom tools (name, description). Add, edit, view full details, and delete tools.
- **Test Run** – Select a chatflow, enter a question, optionally pass history (JSON) and override config (JSON), toggle streaming, and run a prediction. The result is shown in an expandable area.
- **How to** – Short guide cards: when to use Flowise vs OpenAI, SDK vs instance, security, flow types (Editorial, Hotspot, Quiz, UGC, Quest), and quick links to the Flowise GUI and docs.

The header shows the instance URL and a **Live** / **Offline** badge based on `GET /api/flowise/ping`.

## API routes (proxy)

All routes require an authenticated Supabase user and proxy to the Flowise instance with `FLOWISE_API_KEY`.

| Method | Route | Flowise API | Purpose |
|--------|--------|-------------|---------|
| GET | `/api/flowise/ping` | `GET /api/v1/ping` | Instance health. |
| GET | `/api/flowise/chatflows` | `GET /api/v1/chatflows` | List chatflows. |
| POST | `/api/flowise/chatflows` | `POST /api/v1/chatflows` | Create chatflow. |
| GET | `/api/flowise/chatflows/[id]` | `GET /api/v1/chatflows/:id` | Get one chatflow. |
| PUT | `/api/flowise/chatflows/[id]` | `PUT /api/v1/chatflows/:id` | Update chatflow. |
| DELETE | `/api/flowise/chatflows/[id]` | `DELETE /api/v1/chatflows/:id` | Delete chatflow. |
| GET | `/api/flowise/variables` | `GET /api/v1/variables` | List variables. |
| POST | `/api/flowise/variables` | `POST /api/v1/variables` | Create variable. |
| GET | `/api/flowise/variables/[id]` | `GET /api/v1/variables/:id` | Get one variable. |
| PUT | `/api/flowise/variables/[id]` | `PUT /api/v1/variables/:id` | Update variable. |
| DELETE | `/api/flowise/variables/[id]` | `DELETE /api/v1/variables/:id` | Delete variable. |
| GET | `/api/flowise/tools` | `GET /api/v1/tools` | List tools. |
| POST | `/api/flowise/tools` | `POST /api/v1/tools` | Create tool. |
| GET | `/api/flowise/tools/[id]` | `GET /api/v1/tools/:id` | Get one tool. |
| PUT | `/api/flowise/tools/[id]` | `PUT /api/v1/tools/:id` | Update tool. |
| DELETE | `/api/flowise/tools/[id]` | `DELETE /api/v1/tools/:id` | Delete tool. |
| POST | `/api/flowise/predict` | `POST /api/v1/prediction/:id` | Run prediction (body: chatflowId, question, history?, overrideConfig?, streaming?). |

## Environment

- **FLOWISE_BASE_URL** – Flowise instance URL (e.g. `https://flowise-dev.moodmnky.com`). No trailing slash.
- **FLOWISE_API_KEY** – Bearer token for Flowise API. Required for all proxy routes. Never exposed to the client.

## Architecture

- **flowise-sdk** – Used only on the server (e.g. in `app/api/flowise/predict/route.ts`) for `createPrediction`. The SDK is a client of the Flowise API; the runtime is the hosted instance.
- **flowiseFetch** – In `lib/flowise/client.ts`, a server-only helper that builds the Flowise base URL, adds auth headers, and forwards requests. Used by chatflows, variables, tools, and ping proxy routes.
- **Proxy routes** – All under `app/api/flowise/`. They require Supabase auth and forward to the instance with `FLOWISE_API_KEY`.
- **No browser → Flowise** – The control panel UI only calls Next.js API routes. Keys and chatflow IDs are never sent to the client.

## Extending

- To run predictions from elsewhere in the app, use `POST /api/flowise/predict` with `chatflowId`, `question`, and optional `history`, `overrideConfig`, `streaming`. For streaming, the route returns SSE; consume it via a fetch stream or EventSource.
- Vector Upsert, Document Store, Chat Message, Attachments, Assistants, Leads, and Feedback are not proxied in this panel; they can be added as needed.
