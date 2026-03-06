# XIVAPI Endpoints and UI Integration

XIVAPI (https://xivapi.com) provides Lodestone and game data. The app uses `XIVAPI_BASE_URL` and `XIVAPI_API_KEY` from env (root `.env.local` or `apps/hydaelyn/.env`). With a key you get better rate limits.

## Env

- **XIVAPI_BASE_URL** — default `https://xivapi.com` (can use a community mirror).
- **XIVAPI_API_KEY** — optional; improves rate limits. Set in root `.env.local` and/or `apps/hydaelyn/.env` for Hydaelyn; add to Vercel env for production.

---

## Endpoints We Can Hit

Append `?key=YOUR_KEY` (or rely on `lib/lodestone/xivapi.ts` which adds it when set). Many accept `?language=en` or `?snake_case=1`.

### Already used in Hydaelyn

| Endpoint | Method | Purpose | Used in |
|----------|--------|---------|---------|
| `/character/search` | GET | `name`, `server` → first match Lodestone ID | Lodestone character lookup (name+server) |
| `/character/:id` | GET | `extended=1` → profile, ClassJobs, Gear | `/api/lodestone/character`, character game data in FFLogs UI |

### Lodestone (social / profile)

| Endpoint | Params | Purpose |
|----------|--------|---------|
| `/character/search` | `name`, `server` | Character search by name + server |
| `/character/:id` | `extended=1` (optional) | Full character profile (gear, jobs, minions, mounts) |
| `/FreeCompany/search` | `name`, `server` | Free Company search |
| `/FreeCompany/:id` | — | FC profile (estate, focus, recruitment) |
| `/Linkshell/search` | `name`, `server` | Linkshell search |
| `/Linkshell/:id` | — | Linkshell profile |
| `/PvPTeam/search` | `name`, `server` | PvP team search |
| `/PvPTeam/:id` | — | PvP team profile |

### Game data (reference; no Lodestone)

| Endpoint | Params | Purpose |
|----------|--------|---------|
| `/content` | — | List content types (Item, Recipe, Action, etc.) |
| `/Item/:id` | — | Item details (name, icon, stats, description) |
| `/Recipe/:id` | — | Recipe (result item, ingredients, job) |
| `/Action/:id` | — | Action/ability (name, icon, cooldown, job) |
| `/ClassJob/:id` | — | Job/class (name, icon, role, Abbreviation) |
| `/Achievement/:id` | — | Achievement (name, icon, description) |
| `/Title/:id` | — | Title (name) |
| `/Mount/:id` | — | Mount (name, icon) |
| `/Minion/:id` | — | Minion (name, icon) |
| `/Quest/:id` | — | Quest (name, level, class job) |
| `/InstanceContent/:id` | — | Duty (dungeon/trial/raid name, level) |
| `/PlaceName/:id` | — | Zone/place name |
| `/BNpcName/:id` | — | NPC name (e.g. bosses) |
| `/lore` | — | Lore text index |
| `/servers` | — | Server list |
| `/servers/dc` | — | Servers grouped by data center |

### Search (multi-index)

| Endpoint | Params | Purpose |
|----------|--------|---------|
| `/search` | `indexes=Item,Recipe,Action,...`, `string=...`, `filters=...` | Search across game data indexes |

---

## How to Update the UI

### 1. **Character / FFLogs (already in place)**

- **Where:** Dashboard → FFLogs → character lookup and context.
- **What:** `/api/lodestone/character` (backed by XIVAPI character search + character by ID) already powers “Lodestone (XIVAPI)” character game data (ClassJobs, etc.).
- **Improvement:** Ensure env is loaded from root `.env.local` when running `pnpm dev:hydaelyn` so `XIVAPI_API_KEY` and `XIVAPI_BASE_URL` are used (they are now in root `.env.local`).

### 2. **Item / ability tooltips**

- **Where:** Report tables (ability names, item names), character gear, any place we show item or action IDs.
- **How:** Add API routes that proxy XIVAPI, e.g. `GET /api/xivapi/item/[id]`, `GET /api/xivapi/action/[id]`, then call XIVAPI with the same base URL and key used in `lib/lodestone/xivapi.ts`.
- **UI:** On hover or in a small popover, show name, icon (XIVAPI icon URL), and short description.

### 3. **Job / class labels and icons**

- **Where:** Roster tables, character cards, report views.
- **How:** Use `/ClassJob/:id` (or existing FFLogs game data where it overlaps). Add a small helper that maps job ID → name + icon URL (XIVAPI or our own job icons).
- **UI:** Show job icon + name next to player names; optional “Job guide” link to a page that lists ClassJobs from XIVAPI.

### 4. **Duty / instance names**

- **Where:** Report list (encounter/duty name), pull history, “recent duties.”
- **How:** If we have `instanceContentId` or similar from FFLogs, call `/InstanceContent/:id` to get official name (and optional icon).
- **UI:** Replace raw IDs or generic labels with “The Minstrel’s Ballad: Ultima’s Bane” etc. in report and pull lists.

### 5. **Free Company in character view**

- **Where:** Character detail (e.g. in FFLogs character view or Lodestone block).
- **How:** If we have an FC ID from character data, add `GET /api/xivapi/freecompany/[id]` proxying `/FreeCompany/:id`.
- **UI:** Show FC name, tag, and optional link to Lodestone FC page.

### 6. **Server / DC dropdowns**

- **Where:** Character and guild lookup (region/server).
- **How:** Add `GET /api/xivapi/servers` (and optionally `/servers/dc`) to get canonical server list; cache in memory or short TTL.
- **UI:** Populate server and data center dropdowns from XIVAPI so labels match Lodestone/FFLogs.

### 7. **Gear set / glamour display**

- **Where:** Character “game data” card when we have Lodestone gear.
- **How:** We already get Gear from `/character/:id` with `extended=1`. Parse slot → item ID and call `/Item/:id` for name + icon.
- **UI:** Show gear slots with item icons and names (and optional tooltip with stats/description).

### 8. **Achievements / titles**

- **Where:** Character profile or “milestones” section.
- **How:** If we expose achievements/titles from Lodestone character data, resolve names with `/Achievement/:id`, `/Title/:id`.
- **UI:** List recent achievements or current title with icons.

---

## Implementation pattern

- **Server-only:** Keep the key on the server. Add Next.js API routes under `app/api/xivapi/` (e.g. `item/[id]/route.ts`, `action/[id]/route.ts`, `servers/route.ts`) that call XIVAPI with `XIVAPI_BASE_URL` and `XIVAPI_API_KEY` from `process.env`, then return JSON.
- **Shared URL builder:** Reuse the same base URL and key logic (e.g. a small `lib/xivapi/client.ts` that uses `XIVAPI_BASE_URL` and `XIVAPI_API_KEY` and exports `get(path, params)`) so all server-side XIVAPI calls stay consistent.
- **Caching:** For static game data (items, actions, ClassJobs, servers), cache responses in memory or in Supabase/Redis with a long TTL to avoid hitting rate limits.
- **UI:** Use existing design system (shadcn, Tailwind). Add tooltips/popovers for item/action/job details; keep tables and cards consistent with current FFLogs and report UIs.

---

## References

- XIVAPI: https://xivapi.com  
- Game Data (when docs are up): https://xivapi.com/docs/Game-Data  
- Search: https://xivapi.com/docs/Search  
- Hydaelyn Lodestone client: `apps/hydaelyn/lib/lodestone/xivapi.ts`  
- Hydaelyn Lodestone API route: `apps/hydaelyn/app/api/lodestone/character/route.ts`
