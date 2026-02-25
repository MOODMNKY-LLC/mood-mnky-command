# Discord roles and onboarding (Phase 3)

This document is the single reference for the expanded Discord onboarding flow, user roles and permissions, and prompt-to-role mapping. It aligns with [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) (welcome copy, rules) and [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) (categories and channels).

## 1. Onboarding flow (6 steps)

1. **Invite** — User joins via `NEXT_PUBLIC_DISCORD_INVITE_URL` from Main, Dojo, or Verse community; single entry point for consistency.
2. **Default channels** — Community Onboarding grants access to #welcome-and-rules, #announcements, and #general (set via `scripts/set-discord-onboarding.mjs` or Server Settings).
3. **Customization prompt** — One question, e.g. “What brings you here?” with 4–6 options; choices assign **roles** and optional **channel access**, not block entry.
4. **Rules screening** — Require acceptance of server rules before posting (Server Settings → Safety Setup; no API).
5. **Pinned welcome** — First stop is #welcome-and-rules with pinned message: MNKY VERSE / LABZ / SHOP, “Link Discord” in the app, slash commands (/verse, /mood, /sage, /code).
6. **First meaningful action** — Direct users to “Link Discord” and one next step (e.g. “Try /verse in any channel” or “Post in #general”).

## 2. User roles and permissions

### 2.1 Default and interest roles

| Role | Purpose | What it gates |
|------|--------|----------------|
| **Member** | **Default** after onboarding; everyone who passed rules. | Base access: Welcome category, #general, #announcements, #resources. |
| **Verse** | Drops, quests, Dojo. | MNKY VERSE (#drops, #verse-blog, #quests, #dojo). |
| **Blender** | Blending Lab / fragrance community. | MNKY LABZ (#blending-lab, #formulas, #glossary, #fragrance-oils). |
| **Shop** | Products and store. | MNKY SHOP (forum, general, ideas, live-chat, rewards; #orders / #system-status can stay restricted). |
| **DevOps** | Internal technical, CI/build, back office. | Building/Testing category, bot channels; keep small. |
| **Moderator** | Trust and safety. | #moderator-only; warn/timeout/remove; optionally read Building/Testing. |
| **Admin / Builder** | Internal, technical. | Server settings, full control; keep small. |

### 2.2 Tiered subscriber roles (mood/sage naming)

| Role | Purpose | Notes |
|------|--------|--------|
| **Subscriber** | Base paid / linked subscription. | Entry tier; sync from app or assign manually. |
| **Dojo Member** | Elevated member; Dojo access. | Mid tier; subscription-based Dojo access. |
| **MOOD Insider** | Top tier; early access, exclusives. | Highest tier; rewards, early drops. |

- **Member** is the **default** role after onboarding; ensure it exists (or use @everyone + named roles).
- **Interest roles (Verse, Blender, Shop):** Driven by onboarding prompt (or future self-service in Discord); gate channel visibility for their category.
- **App progression (XP, level):** Stays in app; `profiles.discord_user_id` used for quest/event attribution. Future **roles by level:** one-way sync from `xp_state.level` to a Discord role (e.g. “Scent Runner”) via Inngest; see [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md).

**DevOps** replaces LABZ for *internal* technical access; **Blender** is the *community* role for Blending Lab channels. **Brand-aligned display names (mood/sage):** Scentser, Blender, Verse Explorer, Dojo Member, Collector, MOOD Insider — use as display names for the above or as extra level-based tiers (e.g. "Scent Runner" synced from app).

## 3. Customization question and mapping

- **Question:** “What brings you here?”
- **Options and mapping:**
  - **Drops & quests** → role **Verse**; grant access to MNKY VERSE channels.
  - **Blending Lab / fragrance** → role **Blender**; grant access to MNKY LABZ channels.
  - **MNKY SHOP / products** → role **Shop**; grant access to MNKY SHOP channels (excluding #orders / #system-status if restricted).
  - **Just browsing** → no extra role; Member only (base access).
  - **Gaming** (optional) → optional Gaming role if you gate Gaming category.
- **Multi-select:** If Discord allows multiple choices, grant all selected interest roles (e.g. Verse + Blender). No option removes base access to #welcome-and-rules or #general.

## 4. Automated vs manual

| Item | Automated | Manual |
|------|-----------|--------|
| Default channels | Yes — `scripts/set-discord-onboarding.mjs` or Discord API `PUT /guilds/:id/onboarding` with `default_channel_ids` | — |
| Onboarding prompts (question + options) | Yes — same PUT with `prompts[]`; each option can have `role_ids` and `channel_ids` | — |
| Role/channel assignment on join | Yes — Discord assigns roles/channels from selected prompt options | — |
| Rules Screening | — | Server Settings → Safety Setup |
| Creating roles | — | Server Settings → Roles, or `POST /guilds/:id/roles` |
| Channel permission overwrites | Possible via API once role IDs exist | Or set in Server Settings per category |

## 5. Implementation order

1. **Create roles in Discord** — Server Settings → Roles (or API): **Member** (default), Verse, Blender, Shop, **DevOps**, Subscriber, Dojo Member, MOOD Insider (tiered), Moderator, Admin/Builder. Record each **role ID**.
2. **Set channel permission overwrites** — For MNKY VERSE, MNKY LABZ, MNKY SHOP: allow “View channel” for the corresponding role (Verse, Blender, Shop), or leave everyone visible and use roles for identity only. Keep #moderator-only and Building/Testing for Moderator, DevOps, and Admin only.
3. **Map prompt options to role IDs and channel IDs** — Document mapping (e.g. in this file or in script config); use it to build the `prompts` payload for the onboarding API.
4. **Extend onboarding script (optional)** — Extend `scripts/set-discord-onboarding.mjs` to send `prompts` in `PUT /guilds/:id/onboarding` with one prompt and options containing the correct `role_ids` and `channel_ids`. Run after roles exist.
5. **Document role IDs** — Add a “Role IDs” subsection to [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) or keep in env/config for level→role (e.g. `DISCORD_LEVEL_ROLES`).
6. **Revise onboarding doc** — Ensure [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) references this flow and the roles table.

## 6. Scripts and references

- **Default channels and onboarding:** `scripts/set-discord-onboarding.mjs` — sets `default_channel_ids`, preserves existing prompts; can be extended to set `prompts` with role/channel mapping.
- **Welcome embed:** `scripts/post-discord-welcome-embed.mjs` — posts and pins welcome message in #welcome-and-rules.
- **Server map refresh:** `scripts/fetch-discord-server-map.mjs` — refresh [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) after channel or role changes.

## References

- [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) — Welcome copy, rules text, channel setup checklist
- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Categories, channels, category IDs
- [DISCORD-SERVER-RESTRUCTURE.md](DISCORD-SERVER-RESTRUCTURE.md) — Restructure rationale and bot roles
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Events API, roles by level (future)
- [DISCORD-BRAND-ALIGNMENT.md](DISCORD-BRAND-ALIGNMENT.md) — Role names and colors
