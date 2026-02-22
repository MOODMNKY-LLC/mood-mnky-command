# Free-Tier Onboarding (Dojo Dashboard)

## Goal

Increase conversions to the free tier by prompting users on first Dojo visit with a one-time onboarding tutorial, integrated into gamification (XP messaging), with verification shown once completed.

## Behavior

1. **First visit (subscription_tier is null):**
   - Show a **prominent onboarding card** at the top of the Dojo home: “Join free to unlock XP and quests” with concrete XP amounts (50 per manga read, 75 per quiz, 25 per download, up to 150 on orders $75+, 250 for UGC approval). CTA → `/verse/join`. Button **“Remind me later”** dismisses the card and stores `preferences.free_tier_prompt_dismissed_at` (ISO timestamp). Card can reappear after 7 days if still not subscribed.
   - Show a **perpetual notice** (compact bar or line) whenever tier is null: “Complete free signup to earn XP: 50 per manga read, 75 per quiz, 25 per download, up to 150 on $75+ orders.”
2. **Dismissed:** Card is hidden until 7 days after `free_tier_prompt_dismissed_at` or until user joins free tier. Perpetual notice remains until they complete free signup.
3. **Completed (subscription_tier is 'free' or 'member'):** No prompt. Show **verification** on the dashboard (e.g. “Free tier active” badge or small section) so the user sees that the step is done and they’re eligible for XP.

## Data

- **profiles.subscription_tier** — already exists; drives prompt vs verification.
- **profiles.preferences.free_tier_prompt_dismissed_at** — optional ISO timestamp; set when user clicks “Remind me later”. Used to hide the big card for 7 days.

## API

- **POST /api/me/free-tier-prompt-dismiss** — authenticated; sets `preferences.free_tier_prompt_dismissed_at = now()`, returns 200. Idempotent.

## UI placement

- **Dojo home** (`/dojo`): Onboarding card (when tier null and not recently dismissed), perpetual notice (when tier null), and verification badge/section (when tier free/member). Uses existing Dojo design (shadcn Card, Button) and Verse join flow (/verse/join).

## Gamification link

- Copy emphasizes that XP is only awarded after free signup (see FREE-TIER-SUBSCRIPTION.md §6). Amounts match config_xp_rules / MAG-XP-RULES.md defaults.

## References

- FREE-TIER-SUBSCRIPTION.md
- MAG-XP-RULES.md
- Dojo: apps/web/app/dojo/page.tsx, components/dojo/
