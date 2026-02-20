# Glossary data

## Populating the full fragrance note glossary

**Supabase** is the source of truth for the app. **Notion** (MNKY Note Glossary) is optional for editing; sync runs Notion → Supabase.

### Option 1: Fetch from CandleScience and seed Supabase (recommended)

```bash
pnpm glossary:fetch-and-seed
```

This fetches the [CandleScience Fragrance Note Glossary](https://www.candlescience.com/fragrance-note-glossary/), writes `fragrance-glossary-raw.txt`, and runs the seed script to upsert into Supabase.

- **Requires:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- **Local:** Run `pnpm glossary:seed-local` (uses `supabase status -o env`; requires `supabase start`)
- **Production:** Run `pnpm glossary:seed-production` (uses Vercel production env; requires `SUPABASE_SERVICE_ROLE_KEY` in Vercel. If missing, add to `.env` and run `pnpm glossary:fetch-and-seed` instead)
- **Legal:** CandleScience content is proprietary. For production, paraphrase/rewrite or obtain permission.

### Option 2: Seed from an existing file

If you already have the glossary as markdown in the expected format:

```bash
pnpm seed:fragrance-notes --file=scripts/data/fragrance-glossary-raw.txt
```

Expected format (per note):

```
### Note Name
#### Description:
comma, separated, descriptors
#### Olfactive Profile:
Paragraph text.
#### Facts:
Paragraph text.
```

### Two-way sync with Notion

**Notion ↔ Supabase** is supported via `POST /api/notion/sync/fragrance-notes` with a body:

| Direction | Body | Effect |
|-----------|------|--------|
| **Notion → Supabase** (default) | `{}` or `{ "direction": "to-supabase" }` | Overwrites Supabase `fragrance_notes` from MNKY Note Glossary in Notion |
| **Supabase → Notion** | `{ "direction": "to-notion" }` or `{ "direction": "from-supabase" }` | Creates or updates Notion pages from Supabase (matches by `slug`) |

Examples:

```bash
# Push Notion → Supabase (e.g. after editing in Notion)
curl -X POST http://localhost:3000/api/notion/sync/fragrance-notes \
  -H "Content-Type: application/json" -d '{}'

# Push Supabase → Notion (e.g. after fetch-and-seed, to fill Notion)
curl -X POST http://localhost:3000/api/notion/sync/fragrance-notes \
  -H "Content-Type: application/json" -d '{"direction":"to-notion"}'
```

The app always reads the glossary from **Supabase**; Notion is for editing and optional sync.
