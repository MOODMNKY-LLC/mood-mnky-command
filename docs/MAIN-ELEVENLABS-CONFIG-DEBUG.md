# Main ElevenLabs config debugging

When the Main page shows "Voice is not configured yet" or "Couldn't load voice config" in the Talk to MOOD MNKY dialog, use this checklist.

## 1. Verify database state

In the **same** Supabase project the app uses (`NEXT_PUBLIC_SUPABASE_URL`), run in SQL Editor or via Supabase MCP:

```sql
SELECT id, agent_id, show_voice_section, updated_at
FROM main_elevenlabs_config
WHERE id = 'default';
```

Confirm:

- The row exists.
- `agent_id` is set to your ElevenLabs agent ID (not null/empty) after saving from LABZ.
- You are not querying a different environment (e.g. local DB vs production).

If the row is missing, run the migrations that create `main_elevenlabs_config`. If `agent_id` is null, set the Main agent in LABZ → Chat → Main ElevenLabs and save.

## 2. Check server logs (development)

With `NODE_ENV=development`, the GET handler logs once per request:

- `[main/elevenlabs-config] GET: { hasAgentId: true }` when the row has `agent_id` set.
- `[main/elevenlabs-config] GET: { hasAgentId: false }` when the row exists but `agent_id` is null.
- `[main/elevenlabs-config] GET: { row: null }` when no row is returned (e.g. RLS or wrong id).

Use this to confirm what the API is reading from the DB.

## 3. Same config source

- Main page and LABZ both call `/api/main/elevenlabs-config` (relative URL, same origin).
- If you have multiple deployments (staging vs production), set the agent in LABZ in the **same** deployment where you open the Talk to MOOD MNKY dialog so they share the same Supabase project.

## 4. Error vs not configured

- **"Couldn't load voice config. Try again."** — The request failed (network, 500, or invalid response). Use "Try again" or check server logs and DB.
- **"Voice is not configured yet. Set the Main agent in LABZ → Chat → Main ElevenLabs."** — The request succeeded but `agent_id` is null in the returned config. Fix in LABZ or verify DB (step 1).

## References

- API: [apps/web/app/api/main/elevenlabs-config/route.ts](apps/web/app/api/main/elevenlabs-config/route.ts)
- Dialog: [apps/web/components/main/main-talk-to-agent-dialog.tsx](apps/web/components/main/main-talk-to-agent-dialog.tsx)
- Table: [supabase/migrations/20260221200000_main_elevenlabs_config.sql](supabase/migrations/20260221200000_main_elevenlabs_config.sql)
