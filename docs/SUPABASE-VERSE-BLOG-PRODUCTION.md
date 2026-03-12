# Verse Blog: Aligning Production Supabase

Production was showing "Unable to load posts" because the `verse_blog_posts` table (and `author_agent` column) existed only in **local** Supabase, not in **production**. Migration files are now in the repo; production’s migration history differs from the repo, so the table is applied via a single SQL file.

## What was done

1. **Migration files added** (for version control and future parity):
   - `supabase/migrations/20260216181026_verse_blog_posts.sql` – creates `verse_blog_posts` and RLS
   - `supabase/migrations/20260216185101_verse_blog_posts_author_agent.sql` – adds `author_agent`

2. **Single runnable file** (optional step – use the repo SQL in one go):
   - `supabase/migrations/run_verse_blog_on_production.sql` – same DDL in one file, idempotent (safe to run more than once).

3. **Supabase CLI** – Project is linked to production (`supabase link --project-ref chmrszrwlfeqovwxyrmt`).  
   `supabase db push` was not used because production has a different migration history.

## Apply to production (one-time)

**Option A – From the repo (recommended)**  
Open `supabase/migrations/run_verse_blog_on_production.sql`, copy the entire contents, then in [Supabase Dashboard](https://supabase.com/dashboard) → your **production** project → **SQL Editor**, paste and run.

**Option B – Print then paste**  
From the project root run:

```bash
type supabase\migrations\run_verse_blog_on_production.sql
```

Copy the output and run it in the production SQL Editor.

After this, the storefront blog page should load posts (once data is synced from Notion via your sync API).

## Syncing data

- **Local**: Notion → sync API → local Supabase `verse_blog_posts`.
- **Production**: Run the same Notion sync (dashboard or API) against **production** so `verse_blog_posts` in production gets rows. The sync uses `SUPABASE_SERVICE_ROLE_KEY` for the target project; point it at production for production data.

## CLI reference

- **Link production**: `npx supabase link --project-ref chmrszrwlfeqovwxyrmt`
- **Push migrations** (only when remote and repo migration history match): `npx supabase db push`
- **Repair migration history** (advanced): see `supabase migration repair --help` if you later align histories and need to mark remote-only versions as reverted.
