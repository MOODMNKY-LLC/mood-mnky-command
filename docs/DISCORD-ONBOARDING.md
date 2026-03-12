# Discord onboarding: channels and copy

This document provides ready-to-use copy and setup steps for MNKY|VERSE Discord onboarding. Use it to pin a welcome message, refine #welcome-and-rules (or add #start-here), and enable Discord’s Community Onboarding and Rules Screening.

## Official onboarding flow (first pass)

1. **Invite** — User joins via `NEXT_PUBLIC_DISCORD_INVITE_URL` (from Main, Dojo, or Verse community pages).
2. **Community Onboarding** — Default channels: #welcome-and-rules (or #start-here), #announcements, #general (and optionally #resources). See **Customization questions** below for the “What brings you here?” prompt and role mapping.
3. **Rules screening** — Server Settings → Safety → Rules Screening; use the rules copy below. (Manual in Server Settings; no API.)
4. **Pinned welcome message** — In #welcome-and-rules (or #start-here): pin the welcome message below; it includes “Link Discord” and slash commands.
5. **In-app** — Dojo/Verse Community: “Join Discord” + “Link Discord account”; Main community: “Join Discord server”. Linking sets `profiles.discord_user_id` so slash commands and activity count toward quests and XP.

For the full 6-step flow, **user roles and permissions**, and what is automated vs manual, see [DISCORD-ROLES-AND-ONBOARDING.md](DISCORD-ROLES-AND-ONBOARDING.md). See [DISCORD-SERVER-RESTRUCTURE.md](DISCORD-SERVER-RESTRUCTURE.md) for the full restructure and integration context.

### Customization questions

One question, e.g. **“What brings you here?”** with options that assign **roles** (and optional channel access); choices do not block entry.

| Option | Role assigned | Channel access |
|--------|----------------|-----------------|
| Drops & quests | Verse | MNKY VERSE (#drops, #verse-blog, #quests, #dojo) |
| Blending Lab / fragrance | Blender | MNKY LABZ (#blending-lab, #formulas, #glossary, #fragrance-oils) |
| MNKY SHOP / products | Shop | MNKY SHOP (forum, general, ideas, live-chat, rewards) |
| Just browsing | Member only | Base access (welcome, #general, #announcements) |
| Gaming (optional) | Gaming | Gaming category, if you add a role |

Multi-select: grant all selected interest roles. Configure in Server Settings → Onboarding, or via `scripts/set-discord-onboarding.mjs` once role IDs and channel IDs are set (see [DISCORD-ROLES-AND-ONBOARDING.md](DISCORD-ROLES-AND-ONBOARDING.md)).

### User roles and permissions

| Role | Purpose | What it gates |
|------|--------|----------------|
| **Member** | **Default** after onboarding. | Base: Welcome, #general, #announcements, #resources. |
| **Verse** | Drops, quests, Dojo. | MNKY VERSE (#drops, #verse-blog, #quests, #dojo). |
| **Blender** | Blending Lab / fragrance community. | MNKY LABZ (#blending-lab, #formulas, #glossary, #fragrance-oils). |
| **Shop** | Products and store. | MNKY SHOP (forum, general, ideas, live-chat, rewards). |
| **DevOps** | Internal technical, CI/build. | Building/Testing, bot channels. |
| **Moderator** | Trust and safety. | #moderator-only; warn/timeout/remove; optionally Building/Testing read. |
| **Admin / Builder** | Internal, technical. | Server settings, full control. |
| **Subscriber** / **Dojo Member** / **MOOD Insider** | Tiered subscriber roles (mood/sage naming). | Entry → Dojo → top tier; sync from app or assign manually. |

Rules Screening and creating roles are **manual** (Server Settings). Default channels and onboarding prompts (with role/channel mapping) can be **scripted** via `scripts/set-discord-onboarding.mjs`; see [DISCORD-ROLES-AND-ONBOARDING.md](DISCORD-ROLES-AND-ONBOARDING.md).

## 1. Welcome message (pin in #welcome-and-rules or #start-here)

Use the following as the main pinned message. Replace `{APP_URL}` with your Verse URL (e.g. `https://mnky-command.moodmnky.com` or production).

---

**Welcome to MOOD MNKY**

This is the official community server for MOOD MNKY — fragrance, wellness, and the MNKY VERSE.

**What’s here**
- **MNKY VERSE** — Drops, blog, quests, and the Dojo (your private hub). Link your Discord in the app to earn XP and unlock rewards.
- **MNKY LABZ** — Blending Lab, formulas, and fragrance discovery.
- **MNKY SHOP** — Product ideas, rewards, and store chat.

**First steps**
1. Read the rules below and respect them.
2. Introduce yourself in #general if you’d like.
3. **Link your Discord** in the MNKY VERSE so quests and rewards count: {APP_URL}/verse/auth/discord/link  
4. Explore the app: {APP_URL}/verse/community — join drops, do quests, and blend.

**Slash commands:** Use **/verse** for the Dojo and drops, **/mood** for fragrance, **/sage** for learning, **/code** for dev and LABZ.

Always scentsing the MOOD.

---

## 1b. Embed welcome message (rich embed with pin)

For a richer first impression, post an **embed** to #welcome-and-rules and pin it. The script uses the same copy as above and adds a thumbnail (brand icon), color, and fields.

**Script:** `scripts/post-discord-welcome-embed.mjs`

**Requirements:** `DISCORD_BOT_TOKEN_MNKY_VERSE` and `VERSE_APP_URL` (or `NEXT_PUBLIC_APP_URL`) in `.env.local`. The script posts one embed (title, description, thumbnail from `{APP_URL}/mood-mnky-icon.svg`, fields for What's here / First steps / Slash commands, footer) then pins that message.

**Run once:**
```bash
pnpm exec dotenv -e .env.local -- node scripts/post-discord-welcome-embed.mjs
```

If you prefer the plain-text version, pin that instead and do not run the script. The script overwrites nothing; it only adds one new message and pins it.

### 1c. Embed welcome (mood/sage refined)

Copy and field order were refined with **mood-mnky** (brand voice) and **sage-mnky** (structure). The script `post-discord-welcome-embed.mjs` uses this version:

- **Title:** Welcome to MOOD MNKY  
- **Description:** Your home for fragrance, wellness, and the MNKY VERSE. Explore, blend, and connect.  
- **Field order (action first):** **Get started** → **What's here** → **Slash commands**  
- **Get started:** 1. Read the rules below. 2. Say hi in #general if you like. 3. Link Discord in the app (quests count). 4. Explore app — drops, quests, blending.  
- **What's here:** MNKY VERSE (drops, blog, quests, Dojo, link for XP); MNKY LABZ (Blending Lab, formulas); MNKY SHOP (products, rewards).  
- **Slash commands:** /verse · /mood · /sage · /code  
- **Footer:** Always scentsing the MOOD.

---

## 2. Rules channel / rules screening text

Suggested rules for Server Settings → Safety Setup → Rules Screening (or for a #rules channel). Adjust wording to match your moderation policy.

1. **Be kind and inclusive.** No harassment, hate speech, or discrimination. We’re here for fragrance and community.
2. **No spam or self-promotion** unless it’s in a channel meant for it (e.g. sharing blends or UGC where allowed).
3. **Respect privacy.** Don’t share others’ personal info or DMs without consent.
4. **Keep it on topic where it matters.** Use the right MNKY category (Verse, LABZ, Shop) so everyone can find conversations.
5. **Listen to mods.** They’re here to keep the server safe and fun. Appeals can be handled in DMs or a designated channel.

By participating, you agree to these rules. Breaking them may result in a warning, timeout, or removal.

## 3. Channel setup checklist

- [ ] **#welcome-and-rules** (or **#start-here**) — Pin the welcome message above. Optionally add a second pin with “Quick links” (Verse community, Dojo, Link Discord).
- [ ] **#rules** — If you keep a separate #rules channel, post the rules text there and link to it from the welcome message (“Read the rules in #rules”).
- [ ] **Default channels (Community Onboarding)** — Run `scripts/set-discord-onboarding.mjs` (see [DISCORD-PHASE2-WALKTHROUGH.md](DISCORD-PHASE2-WALKTHROUGH.md)) to enable onboarding and set default channels (#welcome-and-rules, #announcements, #general). Or set manually in Server Settings → Onboarding. Add more channels or prompts in the UI if desired.
- [ ] **Customization questions** — Add one question “What brings you here?” with options (Drops & quests → Verse, Blending Lab → LABZ, MNKY SHOP → Shop, Just browsing → Member only). Link options to roles and channel access per [DISCORD-ROLES-AND-ONBOARDING.md](DISCORD-ROLES-AND-ONBOARDING.md); can be set in Server Settings → Onboarding or via extended `set-discord-onboarding.mjs`.
- [ ] **Rules Screening** — Enable in Server Settings → Safety Setup. Paste or adapt the rules text above so new members must accept before chatting.

## 4. Optional: #start-here as a single entry

If you prefer a single “start here” channel instead of (or in addition to) #welcome-and-rules:

- Create a text channel **#start-here** under “Welcome to MOOD🖤MNKY!” (see [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md)).
- Pin the welcome message there.
- Set #start-here as the first default channel in Onboarding so it’s the first thing new members see.

## 5. Refreshing the server map

After adding or renaming channels, refresh the server map:

```bash
pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs
```

Then update [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) if you want the doc to stay in sync.

## References

- [DISCORD-ROLES-AND-ONBOARDING.md](DISCORD-ROLES-AND-ONBOARDING.md) — Full onboarding flow, roles, prompt→role mapping, automated vs manual
- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Categories and channel IDs
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Credentials, endpoints, server map section
- [DISCORD-DEEP-RESEARCH-REPORT.md](DISCORD-DEEP-RESEARCH-REPORT.md) — Onboarding best practices and rationale
