# Discord onboarding: channels and copy

This document provides ready-to-use copy and setup steps for MNKY|VERSE Discord onboarding. Use it to pin a welcome message, refine #welcome-and-rules (or add #start-here), and enable Discord’s Community Onboarding and Rules Screening.

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

Always scentsing the MOOD.

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
- [ ] **Default channels (Community Onboarding)** — In Server Settings → Onboarding, set default channels so every new member sees at least: #welcome-and-rules (or #start-here), #announcements, #general. Add more if desired (e.g. #resources).
- [ ] **Customization questions** — Add 1–2 questions with up to 6 options each, e.g. “What brings you here?” → Fragrance / Blending Lab / Drops & quests / MNKY SHOP / Just browsing. Link answers to the relevant MNKY category channels so members get access to the channels they care about.
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

- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Categories and channel IDs
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Credentials, endpoints, server map section
- [DISCORD-DEEP-RESEARCH-REPORT.md](DISCORD-DEEP-RESEARCH-REPORT.md) — Onboarding best practices and rationale
