# MAG XP Rules (config_xp_rules)

XP awards for manga/magazine and gamification are driven by `config_xp_rules` in Supabase. When a rule key exists, the configured values are used; otherwise, hardcoded defaults apply.

## Keys and payloads

| Key | Payload | Default | Used by |
|-----|---------|---------|--------|
| `mag_read` | `{ "xp": number, "percent_min": 80, "active_seconds_min": 90 }` | 50 XP | Read-event completion (percent_read ≥ 80, active_seconds ≥ 90) |
| `mag_quiz` | `{ "xp": number, "pass_threshold": 70 }` | 75 XP | Quiz passed (once per issue) |
| `mag_download` | `{ "xp": number }` | 25 XP | Download recorded (once per issue/type) |
| `purchase` | `{ "tiers": [{ "subtotal_min": number, "xp": number }] }` | 50 @ $25, 150 @ $75 | Shopify order.paid |
| `ugc_approved` | `{ "xp": number }` | 250 XP | UGC submission approved (once per submission) |

## Seed migration

The migration `20260222100000_seed_config_xp_rules.sql` inserts or upserts default values. Tiers in `purchase` must be ordered by `subtotal_min` descending for correct lookup (highest tier first).

## Quest triggers

When XP is awarded (mag_read, mag_quiz, mag_download, ugc_approved), the Inngest functions emit `quest/evaluate` so quest progress is re-evaluated and composite quests (e.g. read issue X and pass quiz) can complete.

## Verse Backoffice

XP & Quests page displays current `config_xp_rules` (mag_read, mag_quiz, mag_download, purchase, ugc_approved). Edit via Supabase SQL or a future admin UI.
