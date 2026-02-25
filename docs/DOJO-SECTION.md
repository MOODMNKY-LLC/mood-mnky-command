# Dojo Section

The Dojo is the MNKY community surface: a **public portal** (landing, shop, blog, agents) and a **private member hub** (XP, quests, profile, crafting, chat). This doc describes route structure, chrome, and auth.

## Dojo Portal vs Dojo Hub

| Concept | Route | Chrome | Auth |
|--------|--------|--------|------|
| **Dojo Portal** (public landing) | `/dojo` | VerseStorefrontShell: VerseHeader, VerseAdminDock, verse-storefront CSS. No sidebar. | Optional (VerseAuthContext). |
| **Dojo Hub** (member dashboard) | `/dojo/me` and `/dojo/me/*` | DojoDashboardLayout: DojoSidebar, breadcrumb header. No VerseHeader/dock. | Required (DojoAuthContext); unauthenticated redirect to `/auth/login`. |

- **Dojo Portal** is the storefront-style home at `/dojo`: hero, portal cards, featured products, public pages (agents, blog, shop, glossary, formulas, etc.).
- **Dojo Hub** is the private space at `/dojo/me`: hub home (XP, quests, quick actions), profile, preferences, crafting, chat, community.

## Route Structure

| Path | Description | Chrome |
|------|-------------|--------|
| `/dojo` | Public portal landing (hero, portal cards, featured products) | VerseHeader + dock |
| `/dojo/agents`, `/dojo/blog`, `/dojo/shop`, `/dojo/products`, `/dojo/glossary`, `/dojo/formulas`, etc. | Public storefront pages | VerseHeader + dock |
| `/dojo/me` | Member hub home (XP, quests, quick actions, manga/UGC entry points) | DojoSidebar |
| `/dojo/me/profile` | User profile | DojoSidebar |
| `/dojo/me/preferences` | User preferences (default agent, etc.) | DojoSidebar |
| `/dojo/me/crafting`, `/dojo/me/crafting/saved` | Blending Lab, saved blends | DojoSidebar |
| `/dojo/me/chat` | MNKY Chat (member hub) | DojoSidebar |
| `/dojo/me/community` | Community hub (Discord, blog, quests, manga links) | DojoSidebar |
| `/dojo/me/flowise` | Flowise config | DojoSidebar |

Redirects (e.g. in next.config): `/dojo/profile` → `/dojo/me/profile`, `/dojo/preferences` → `/dojo/me/preferences`, `/dojo/crafting` → `/dojo/me/crafting`, `/dojo/flowise` → `/dojo/me/flowise`. Canonical member routes are under `/dojo/me/*`.

## Dashboard-07 Alignment

The Dojo **Hub** sidebar and layout follow the `temp/dashboard-07` pattern (sidebar-07 block):

- **DojoSidebar:** Forwards `...props` to Sidebar, uses `collapsible="icon"`, SidebarRail
- **DojoTeamSwitcher:** Dropdown with contexts (Home, Crafting, Chat), Community section; "Switch to Verse" / MOOD MNKY link
- **DojoNavMain:** SidebarGroup + Collapsible items with sub-menus; flat items use `Link`
- **DojoNavProjects:** Quick access; "Community" links to `/dojo/me/community`
- **DojoSidebarFooter:** NavUser-style dropdown (avatar, name, email, Profile, Preferences, Sign out)
- **Header:** Breadcrumb (The Dojo > current page), SidebarTrigger

## Gamification Integration

The Dojo **Hub** home page (`/dojo/me`) surfaces XP, quests, manga, and UGC per [PRD-Gamification-MNKY-VERSE.md](./PRD-Gamification-MNKY-VERSE.md), [PRD-Collection-Manga-Magazine.md](./PRD-Collection-Manga-Magazine.md), and [MAG-XP-RULES.md](./MAG-XP-RULES.md):

- **XP / Level card:** Fetches from `xp_state`, links to profile
- **Quests card:** Fetches active quests + `quest_progress` completed count, links to `/dojo/quests`
- **Quick actions:** Preferences, MNKY Shop, Chat, Issues, UGC
- **Lower section:** Manga/Issues and UGC entry points linking to `/dojo/issues` and `/dojo/ugc`

APIs: `GET /api/xp/state`, `GET /api/quests`, `GET /api/quests/my-progress`

## Auth Model

- **Dojo Portal (`/dojo` and storefront routes):** Auth optional (VerseAuthContext). Guests can browse; members see personalized hero/copy.
- **Dojo Hub (`/dojo/me/*`):** Auth required. DojoAuthContext fetches user server-side; unauthenticated users are redirected to `/auth/login`.
- **Member access:** Authenticated users can access both Portal and Hub.

## Layout and Components

- **Root Dojo layout:** `app/dojo/layout.tsx` — passthrough.
- **Portal layout:** `app/dojo/(storefront)/layout.tsx` — VerseAuthContext, DojoStorefrontChrome (ThemePaletteProvider, VerseThemeProvider, verse-storefront CSS). Renders VerseStorefrontShell (VerseHeader, VerseFooter, VerseAdminDock).
- **Hub layout:** `app/dojo/me/layout.tsx` — DojoAuthContext, DojoDashboardLayout (DojoSidebar, SidebarInset, Breadcrumb header).
- **Chrome:** `app/dojo/dojo-storefront-chrome.tsx` — shared client chrome for Portal (theme, fonts, PWA).
- **Sidebar:** `components/dojo/dojo-sidebar.tsx` — shadcn sidebar-07 (collapsible icon, team switcher, nav groups, quick access, user footer).
- **Nav config:** `lib/dojo-sidebar-config.tsx` — dojoNavGroups, dojoQuickAccessItems, dojoContexts, dojoCommunityLinks.
- **Page cards (Hub home):** DojoXpCard, DojoQuestsCard, DojoQuickActionsCard, DojoHomeSections.
- **Auth:** `components/dojo/dojo-auth-context.tsx` — server-side user fetch and redirect for Hub.

## Design

Dojo uses root design tokens (see [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)). The `.dojo-dashboard` class wraps Hub main content. Palette (Main vs Dojo) and mode (light/dark) are applied via `data-theme` and `.dark` on the document root.

## Migration

- Legacy `/verse/dojo` redirects to `/dojo`.
- Preferences (default agent) canonical route: `/dojo/me/preferences`.

## Future: Single Dojo entry (product decision)

Optionally, a single Dojo entry could be implemented so that `/dojo` behaves by auth: **guests** see the Dojo Portal (landing, hero, public pages); **logged-in members** are redirected to `/dojo/me` (Hub home). That would make "Dojo" one entry point with behavior depending on auth. Current behavior is explicit: `/dojo` = Portal, `/dojo/me` = Hub; no redirect by auth. If single-entry is adopted, the Portal layout would redirect authenticated users to `/dojo/me` when they visit `/dojo`.
