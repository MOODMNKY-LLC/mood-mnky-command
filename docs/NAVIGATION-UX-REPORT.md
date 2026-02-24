# Navigation UX Analysis and Streamlining Report

This report documents the current navigation architecture, identified UX issues, streamlining recommendations, and the Verse → MNKY DOJO rebrand direction. It supports the consolidation where **MOOD MNKY** (`/main`) is the brand site, **MNKY LABZ** is the back office, and **MNKY DOJO** unifies the storefront and member hub.

---

## 1. Current state

### 1.1 Navigation surfaces

| Surface | Location | Component / file | Purpose |
|--------|----------|------------------|--------|
| Main nav | Top of `/main` | `MainNav` in [apps/web/components/main/main-nav.tsx](apps/web/components/main/main-nav.tsx) | Brand logo, search, Collections dropdown, About/Design/Services/Media/Loyalty/Community, theme toggles, auth. No link to storefront or Dojo in bar. |
| Verse header | Top of `/verse/*` | `VerseHeader` in [apps/web/components/verse/verse-header.tsx](apps/web/components/verse/verse-header.tsx) | MOOD MNKY + MNKY VERSE; nav: Lab (admin), Home, Explore, Blog, Agents, Shop, Rewards, Dojo, Cart; XP, user menu, theme. |
| Dojo sidebar | Left of `/dojo/*` | `DojoDashboardLayout` + [apps/web/lib/dojo-sidebar-config.tsx](apps/web/lib/dojo-sidebar-config.tsx) | Context switcher (Home / Crafting / Chat); nav groups with "MOOD MNKY (Home)", "Back to VERSE", Home, MNKY CHAT, Profile, Preferences; community links. |
| LABZ sidebar | Left of dashboard | `AppSidebar` in [apps/web/components/app-sidebar.tsx](apps/web/components/app-sidebar.tsx) | Context switcher (Lab, Store, Verse, Platform, AI Tools); context-specific groups; footer: Docs, Home→`/main`, Sign out. |
| Main dock | Bottom on `/main` | `MainDock` in [apps/web/components/main/main-dock.tsx](apps/web/components/main/main-dock.tsx) | Single icon: Talk to MOOD MNKY (when voice enabled). |
| Verse dock | Bottom on `/verse/*` | `VerseAdminDock` in [apps/web/components/verse/verse-admin-dock.tsx](apps/web/components/verse/verse-admin-dock.tsx) | Chat, Dojo, Home (MOOD MNKY), LABZ (admin) or VERSE/Explore (non-admin), persona/voice, Shop, Cart. |
| LABZ dock | Bottom on dashboard | `LabzDock` in [apps/web/components/labz/labz-dock.tsx](apps/web/components/labz/labz-dock.tsx) | Single icon: CODE MNKY chat. |
| Auth layout | Auth pages | [apps/web/components/auth/auth-page-layout.tsx](apps/web/components/auth/auth-page-layout.tsx) | "Home" → `/main`. |

### 1.2 Cross-links (who links where)

| From | To Main | To Verse (storefront) | To Dojo (member hub) | To LABZ |
|------|---------|------------------------|----------------------|--------|
| Main | — | Hero/footer/CTAs only; no nav bar link | User menu: Dojo, Profile | Admin: "Lab" → `/platform` |
| Verse | Header "MOOD MNKY" → `/main` | Header "MNKY VERSE", Home, Explore, etc. | Header "Dojo" → `/dojo`; dock | Admin: "Lab" → `/` |
| Dojo | Sidebar "MOOD MNKY (Home)" → `/main` | Sidebar "Back to VERSE" → `/verse` | Sidebar Home, Chat, Profile, etc. | — |
| LABZ | Header "Home" + footer "Home" → `/main` | Context "Verse" + ecosystem "MNKY VERSE" → `/verse` | — | — |

### 1.3 UX issues

1. **Discoverability from Main** — Main has no persistent nav entry for the storefront. Users only reach it via hero CTAs ("Join MNKY VERSE", "Shop the store") or footer. Finding the store from the brand site is not obvious.
2. **Two names, one idea** — "MNKY VERSE" (storefront + community) and "The Dojo" (member hub) feel like two products. Verse header links to Dojo; Dojo sidebar says "Back to VERSE". This increases cognitive load: when to use Verse vs Dojo.
3. **Dock inconsistency** — Main: one icon (talk). Verse: many (chat, dojo, main, lab/verse, persona, shop, cart). LABZ: one (CODE MNKY). No shared "ecosystem dock" that always offers Main / Dojo / LABZ (for admins) in a consistent way.
4. **LABZ ↔ Dojo** — LABZ has a "Verse" context but no "Dojo" entry; Dojo has no direct link to LABZ. Admins must go Verse → Lab or Main → Lab.
5. **Dojo sidebar wording** — "Back to VERSE" reinforces separation; community links open Verse pages (blog, quests, issues) in new tabs, so users leave Dojo to use "Verse" features.

---

## 2. Streamlining recommendations

### 2.1 Main nav: add storefront entry

- Add a single top-level link on Main nav (e.g. **"Dojo"** or **"Store"**) that goes to the storefront (`/verse` or, after rebrand, the same URL with "MNKY DOJO" positioning).
- Placement: e.g. after Collections or before About, so the path Main → Store/Dojo is always visible.
- **Implemented:** "Dojo" link added in `MainNav` pointing to `/verse`.

### 2.2 Unified dock labels

- **Verse dock:** Use consistent labels: "Home (MOOD MNKY)" for `/main`, "Dojo" (or "Dojo Home") for `/verse`, "LABZ" for `/` when admin. Drop "VERSE" in favor of "Dojo" so one mental model.
- **Implemented:** Verse dock tooltips/labels updated to "Dojo" where they previously said "VERSE".

### 2.3 LABZ: Dojo in ecosystem

- In LABZ sidebar context switcher and ecosystem links, rename "MNKY VERSE" to **"MNKY DOJO"** and keep the same href (`/verse`) so admins can jump to the public dojo in one click.
- **Implemented:** `labz-sidebar-context.ts` and `sidebar-config.tsx` use "MNKY DOJO" label where appropriate.

### 2.4 Dojo sidebar: replace "Back to VERSE"

- Replace "Back to VERSE" with **"Dojo Home"** or **"Store"** pointing to `/verse` (storefront home), so the Dojo sidebar uses one product name and the link is clearly "back to the public dojo."
- **Implemented:** `dojo-sidebar-config.tsx` uses "Dojo Home" (or "Back to Dojo") and "MNKY DOJO" in community links.

---

## 3. Rebrand: Verse → MNKY DOJO

### 3.1 Direction

- **MOOD MNKY** (`/main`) — Brand and landing (unchanged).
- **MNKY LABZ** — Back office (unchanged).
- **MNKY DOJO** — Single name for:
  - **Public Dojo:** current Verse storefront (shop, explore, blog, agents, rewards, quests, community) at `/verse/*`.
  - **Private Dojo:** current Dojo (profile, chat, crafting, preferences) at `/dojo/*`.

Routes stay as-is (Option A): `/verse/*` for storefront, `/dojo/*` for member hub; only labels, copy, and assets change to "MNKY DOJO" / "The Dojo."

### 3.2 Copy and naming changes

- Headers and footers: "MNKY VERSE" → **"MNKY DOJO"** (or "The Dojo" where it reads better).
- Meta titles and descriptions: e.g. "MNKY VERSE" → "MNKY DOJO" in storefront layout/metadata.
- Sidebars and docks: "VERSE", "Back to VERSE", "MNKY VERSE" → "Dojo", "Dojo Home", "MNKY DOJO".
- Docs and comments: MAIN-SECTION-NAVIGATION.md and DESIGN-SYSTEM.md updated to refer to "MNKY DOJO" storefront where appropriate.
- Hero/footer CTAs: "Join MNKY VERSE" can become "Join MNKY DOJO" or "Enter the Dojo"; links remain `/verse`.

### 3.3 Design system

- DESIGN-SYSTEM.md already uses "Dojo" for the second palette. Verse storefront CSS/tokens (`verse-storefront.css`, `--verse-*`) are unchanged; document that the "Dojo" palette applies to the MNKY DOJO storefront so one palette = one product name.
- No new tokens or theme layers required for the rebrand.

### 3.4 Route strategy (Option A — implemented)

- **Paths:** Keep `/verse/*` for storefront and `/dojo/*` for member hub.
- **Redirects:** None.
- **Internal links:** All updated to use "MNKY DOJO" in labels; hrefs remain `/verse` and `/dojo` as today.
- **External references:** Shopify theme, auth callbacks, and env (e.g. `NEXT_PUBLIC_VERSE_APP_URL`) can keep existing URLs; only customer-facing copy changes to "MNKY DOJO."

### 3.5 Optional future: Option B (route migration)

If you later move the storefront under `/dojo`:

- Redirect `/verse` → `/dojo`, `/verse/*` → `/dojo/*` (or a chosen structure like `/dojo/shop`, `/dojo/explore`).
- Move or duplicate `(storefront)/verse` pages under a new `(storefront)/dojo` (or under root `dojo` with public vs member routes).
- Update all internal hrefs, env, Shopify Customer Account API callback/logout URLs, and docs.

---

## 4. Files and config touchpoints

| Area | File(s) | Change |
|------|---------|--------|
| Main nav | [apps/web/components/main/main-nav.tsx](apps/web/components/main/main-nav.tsx) | Add "Dojo" link to `/verse`. |
| Verse header | [apps/web/components/verse/verse-header.tsx](apps/web/components/verse/verse-header.tsx) | "MNKY VERSE" → "MNKY DOJO". |
| Verse footer | [apps/web/components/verse/verse-footer.tsx](apps/web/components/verse/verse-footer.tsx) | "MNKY VERSE" → "MNKY DOJO". |
| Verse dock | [apps/web/components/verse/verse-admin-dock.tsx](apps/web/components/verse/verse-admin-dock.tsx) | Labels: "VERSE" → "Dojo", "Home (MOOD MNKY)" kept. |
| Dojo sidebar | [apps/web/lib/dojo-sidebar-config.tsx](apps/web/lib/dojo-sidebar-config.tsx) | "Back to VERSE" → "Dojo Home"; community "MNKY VERSE Blog" → "MNKY DOJO Blog". |
| LABZ sidebar | [apps/web/lib/sidebar-config.tsx](apps/web/lib/sidebar-config.tsx), [apps/web/lib/labz-sidebar-context.ts](apps/web/lib/labz-sidebar-context.ts) | "MNKY VERSE" → "MNKY DOJO" in verse context and ecosystem links. |
| Main hero/footer/CTAs | [apps/web/components/main/main-hero.tsx](apps/web/components/main/main-hero.tsx), [apps/web/components/main/main-footer.tsx](apps/web/components/main/main-footer.tsx), [apps/web/components/main/main-hero-split.tsx](apps/web/components/main/main-hero-split.tsx) | "Join MNKY VERSE" → "Join MNKY DOJO" or "Enter the Dojo"; links stay `/verse`. |
| Docs | [docs/MAIN-SECTION-NAVIGATION.md](docs/MAIN-SECTION-NAVIGATION.md) | Main → Dojo link; "Verse" → "MNKY DOJO" in tables. |

---

## 5. Summary

- **Report:** This document is the navigation UX report (current state, tables, issues, recommendations).
- **Quick wins:** Main nav "Dojo" link; unified dock and sidebar labels (Dojo, Home, LABZ).
- **Rebrand:** All user-facing "MNKY VERSE" / "Verse" copy updated to "MNKY DOJO" / "Dojo" with Option A (paths unchanged).
- **Result:** One clear mental model: Main = brand, LABZ = back office, MNKY DOJO = storefront + member hub; navigation between them is explicit and consistent.
