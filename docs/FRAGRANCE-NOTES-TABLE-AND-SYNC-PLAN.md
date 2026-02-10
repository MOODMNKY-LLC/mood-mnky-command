# Fragrance Notes Table & Two-Way Notion Sync — Setup Plan

This document is the single reference for creating the `fragrance_notes` Supabase table and setting up two-way sync with the Notion **MNKY Note Glossary** database. It assumes you want one source of truth that can be pushed either way (Notion ↔ Supabase) with rate limiting and clear runbooks.

---

## 1. Overview & Current State

| Component | Status |
|-----------|--------|
| **Migration** | `supabase/migrations/20260209110000_fragrance_notes.sql` exists and defines the table and RLS |
| **Notion DB** | MNKY Note Glossary — ID `1e8a4b85-160d-43c2-b6ae-c013744608d7` (in `lib/notion.ts`) |
| **Sync API** | `POST /api/notion/sync/fragrance-notes` with `direction`: `to-supabase` (default) or `to-notion` |
| **Rate limiting** | 500 ms delay between each Notion create/update (Supabase → Notion); no 429 retry yet |
| **Public API** | `GET /api/fragrance-notes` and `GET /api/fragrance-notes/[slug]` read from Supabase (admin client) |

The typical failure **"relation public.fragrance_notes does not exist"** means the migration has not been applied to the Supabase project your app is using (e.g. wrong project in `.env.local` or migrations never pushed).

---

## 2. Prerequisites

- **Local vs production** — For local development, use **local** Supabase and apply migrations with `supabase db reset`. See **`docs/SUPABASE-LOCAL-AND-PRODUCTION.md`** for the single source of truth.
- **Notion integration** — The MNKY Note Glossary database must be shared with the integration; `NOTION_API_KEY` in `.env.local`.
- **Env in app** — `.env.local` must point at the Supabase instance you’re using (local: URL from `supabase status`; production: that project’s URL and keys).
- **sync_logs table** — Already created in `20250206000000_initial_schema.sql`; no extra migration needed.

---

## 3. Step 1 — Create the `fragrance_notes` Table

### 3.1 Migration file

The table is defined in:

**File:** `supabase/migrations/20260209110000_fragrance_notes.sql`

- **Columns:** `id` (uuid, PK), `name`, `slug` (unique), `description_short`, `olfactive_profile`, `facts`, `created_at`, `updated_at`
- **Indexes:** unique on `slug`, index on `name`, index on `lower(left(name,1))`
- **RLS:** Enabled; one policy: `fragrance_notes_select_authenticated` (SELECT for `authenticated` only). The app currently uses the **service role** for all access (sync and public API), so RLS is bypassed; no anon policy is required unless you later switch to client-side Supabase with anon key.

### 3.2 Apply the migration

**Local development** — Apply all migrations (including `fragrance_notes`) to your **local** DB:

```bash
supabase db reset
```

See **`docs/SUPABASE-LOCAL-AND-PRODUCTION.md`**: `supabase db push` only affects the **linked remote**; it does not update local. For local, use `db reset`.

**Production** — When deploying schema to production:

```bash
supabase link --project-ref <your-production-project-ref>
supabase db push
```

Confirm in the Supabase Dashboard (or Studio for local) that `public.fragrance_notes` exists.

---

## 4. Step 2 — sync_logs (Already Done)

The sync route writes to `sync_logs` (source, entity_type, records_synced, status, error_message). That table is created in `20250206000000_initial_schema.sql`. No action unless you use a fresh DB that hasn’t had the initial schema applied; in that case run all migrations (e.g. `supabase db push`).

---

## 5. Step 3 — Notion MNKY Note Glossary

- **Database ID:** `1e8a4b85-160d-43c2-b6ae-c013744608d7` (see `lib/notion.ts` → `NOTION_DATABASE_IDS.fragranceNotes`).
- **Required properties** (used by sync):
  - **Name** (title)
  - **Slug** (rich_text) — used as unique key for create/update
  - **Description Short** (rich_text)
  - **Olfactive Profile** (rich_text)
  - **Facts** (rich_text)

If you have extra properties (e.g. CandleScience Products, Aliases, First Letter), the sync does not clear them; it only sets the five above. Ensure the integration has access to the database (database shared with the integration).

---

## 6. Step 4 — Initial Data

Two common paths:

**Path A — Seed from CandleScience, then push to Notion**

1. Apply migrations so `fragrance_notes` exists (Step 1).
2. Run the glossary fetch and seed:
   ```bash
   pnpm glossary:fetch-and-seed
   ```
   This populates Supabase from the CandleScience glossary (232 notes).
3. Run sync **Supabase → Notion** (Step 8) so Notion is populated from Supabase.

**Path B — Notion-first**

1. Apply migrations (Step 1).
2. Manually (or via Notion UI) add/edit notes in the MNKY Note Glossary.
3. Run sync **Notion → Supabase** (default direction) to backfill Supabase.

---

## 7. Step 5 — Two-Way Sync Implementation

### 7.1 Direction

- **`direction: "to-supabase"`** (default) — Notion is source: all glossary pages are read, mapped to rows keyed by slug, and upserted into `fragrance_notes` (on conflict `slug`). Notion wins.
- **`direction: "to-notion"`** (or `"from-supabase"`) — Supabase is source: all `fragrance_notes` rows are read; for each slug, either a new Notion page is created or an existing one is updated. Supabase wins.

There is no merge logic; each run overwrites the target side for the set of records that exist on the source side.

### 7.2 Notion API rate limits (official)

- **Limit:** Average **3 requests per second** per integration (some bursts allowed).
- **429:** Response code `429` with body indicating `rate_limited`; **Retry-After** header may be present (seconds, possibly decimal).
- **Best practice:** Throttle to ~2 req/s and handle 429 with backoff (prefer respecting `Retry-After`).

Reference: [Notion — Request limits](https://developers.notion.com/reference/request-limits).

### 7.3 Current behavior in code

- **Supabase → Notion:** After each create or update, the route waits **500 ms** (`NOTION_RATE_LIMIT_MS`), so effective rate is ~2 req/s. There is no 429 retry yet.
- **Notion → Supabase:** One bulk upsert to Supabase; no Notion rate limit concern for that direction. Listing Notion pages uses `queryAllPages`, which paginates (100 per request); for 232 pages that’s 3 requests, which is within limits.

### 7.4 Recommended improvements

1. **429 retry** — In `app/api/notion/sync/fragrance-notes/route.ts`, wrap Notion API calls (create/update and, if desired, each `queryDatabase` in `queryAllPages`) in a helper that:
   - On 429, reads `Retry-After` (or uses a default, e.g. 2 s), waits, then retries.
   - Caps retries (e.g. 3–5) and then fails with a clear error.
2. **Throttle pagination** — In `lib/notion.ts`, inside `queryAllPages`, add a short delay (e.g. 350 ms) between each paginated `queryDatabase` call so that listing large databases doesn’t contribute to bursts.
3. **Optional: batch size** — If you ever need to process only a subset (e.g. `offset`/`limit`), extend the sync API to accept query params and process in batches; for 232 notes, current single-run approach is acceptable.

---

## 8. Verification & Runbook

### 8.1 Confirm table exists

```bash
# Using Supabase CLI (replace with your DB URL if needed)
supabase db diff
# Or in SQL Editor in Dashboard:
# SELECT count(*) FROM public.fragrance_notes;
```

### 8.2 Seed (if using Path A)

```bash
pnpm glossary:fetch-and-seed
```

### 8.3 Sync Supabase → Notion (populate Notion from Supabase)

```bash
# Unix / Git Bash
curl -s -X POST http://localhost:3000/api/notion/sync/fragrance-notes \
  -H "Content-Type: application/json" \
  -d '{"direction":"to-notion"}'

# Windows PowerShell (use a file to avoid quoting issues)
curl -s -X POST http://localhost:3000/api/notion/sync/fragrance-notes -H "Content-Type: application/json" -d "@scripts/data/sync-to-notion-body.json"
```

(You can create `scripts/data/sync-to-notion-body.json` with content `{"direction":"to-notion"}`.)

Expected: `{"success":true,"direction":"supabase-to-notion","created":232,"updated":0,"total":232,...}` (or similar; created/updated depend on initial state). With 232 notes and 500 ms delay, the request can take ~2 minutes.

### 8.4 Sync Notion → Supabase (overwrite Supabase from Notion)

```bash
curl -s -X POST http://localhost:3000/api/notion/sync/fragrance-notes \
  -H "Content-Type: application/json" \
  -d '{}'
# or explicitly: -d '{"direction":"to-supabase"}'
```

Expected: `{"success":true,"direction":"notion-to-supabase","recordsSynced":...,...}`.

### 8.5 Read-only check (Notion as source)

```bash
curl -s http://localhost:3000/api/notion/sync/fragrance-notes
```

Returns the list of notes as read from Notion (for debugging).

### 8.6 Troubleshooting: "relation public.fragrance_notes does not exist"

You’re in **local development** and the app uses the DB from `.env.local`:

1. **Use local Supabase** — `.env.local` should point to **local** (URL and keys from `supabase status`). See **`docs/SUPABASE-LOCAL-AND-PRODUCTION.md`**.
2. **Apply migrations to local** — `supabase db push` does **not** update local. Run:
   ```bash
   supabase db reset
   ```
   Then re-run any seeds (e.g. `pnpm glossary:fetch-and-seed`).
3. **Restart the dev server** — Restart `pnpm dev` so it reloads `.env.local`, then run the sync again.

---

## 9. Conflict Resolution & Ongoing Use

- **No automatic merge** — Each sync run overwrites the target by the source’s current state (keyed by slug). To “merge” manually, edit in one system and run the sync in that direction.
- **Recommended workflow** — Choose one primary system (e.g. Supabase for bulk seed and app reads; Notion for editorial tweaks). Then:
  - **Notion as editor:** Edit in Notion → run `direction: to-supabase` when you want to push to the app.
  - **Supabase as editor:** Edit via app/API or seed scripts → run `direction: to-notion` when you want to push to Notion.
- **Idempotency** — Repeated syncs in the same direction are safe; same slug → same row/page updated.

---

## 10. Checklist Summary

- [ ] Supabase project decided (local or hosted); `.env.local` points to it.
- [ ] Migrations applied: `supabase db push` (so `fragrance_notes` and `sync_logs` exist).
- [ ] Notion MNKY Note Glossary has required properties (Name, Slug, Description Short, Olfactive Profile, Facts) and is shared with the integration.
- [ ] Initial data: either seed Supabase then sync to Notion, or fill Notion then sync to Supabase.
- [ ] Optional: add 429 retry and pagination throttle (see 7.4).
- [ ] Run verification commands (8.1–8.5) and confirm counts and responses.

Once the table exists and one full sync has been run in the direction you need, the two-way sync is set up; you can run the same POST requests whenever you want to refresh one system from the other.
