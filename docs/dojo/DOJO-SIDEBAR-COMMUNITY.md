# Dojo Sidebar and Community Section

Short reference for the Dojo sidebar structure and Community hub after the sidebar optimization.

## Sidebar routing rules

- **Dashboard-only**: Sidebar nav and quick access use only routes under `/dojo/*` (e.g. `/dojo`, `/dojo/chat`, `/dojo/profile`, `/dojo/preferences`, `/dojo/crafting`, `/dojo/community`).
- **No direct Verse links in sidebar**: Links to `/verse/shop`, `/verse/chat`, `/verse/issues`, `/verse/ugc`, `/verse/glossary` are not in the Dojo sidebar; they are reached via the Community section or the Dojo Community hub page.

## Contexts

- **Context** (team switcher): **Home**, **Crafting**, **Chat**. Verse is not a context; switching context only changes which nav groups are shown (e.g. Crafting shows Blending Lab / Saved Blends; Chat shows chat-specific items).
- **Legacy "verse" context**: If a user had "verse" persisted in storage, it is migrated to "home" on first load.

## Community section (team switcher)

- **Community** is a second section in the Dojo team/context switcher dropdown, below the context list.
- **Join Discord**: Shown when `NEXT_PUBLIC_DISCORD_INVITE_URL` is set; opens invite in a new tab.
- **Link Discord account**: Links to `/verse/auth/discord/link` (same tab for OAuth).
- **Community hub**: Links to `/dojo/community` (dashboard).
- **MNKY VERSE Blog**, **Quests & XP**, **Manga & Issues**: Open Verse routes in a new tab.

## Dojo Community hub page

- **Route**: `/dojo/community`.
- **Purpose**: Single dashboard page with cards for Discord (invite + link account), Blog, Quests, Manga, UGC, and link to Verse community page. Keeps users inside the dashboard while offering all community entry points.
- **Quick access**: The sidebar "Community" (formerly "More") button links to `/dojo/community`.

## Config and files

- **Nav and community links**: `apps/web/lib/dojo-sidebar-config.tsx` — `dojoContexts`, `dojoNavGroups`, `dojoCraftingNavGroups`, `dojoChatNavGroups`, `getDojoNavGroupsForContext`, `dojoQuickAccessItems`, `dojoCommunityLinks`, `DISCORD_INVITE_URL`.
- **Team switcher**: `apps/web/components/dojo/dojo-team-switcher.tsx` — renders Context list then Community section.
- **Quick access / More**: `apps/web/components/dojo/dojo-nav-projects.tsx` — "Community" → `/dojo/community`.
- **Context state**: `apps/web/components/dojo/dojo-context-provider.tsx` — normalizes stored "verse" to "home".

## LAB admin dashboard

- **Community group**: In the LAB app sidebar (`apps/web/components/app-sidebar.tsx`), the collapsible that contains Manga/Issues, Manga Collections, XP & Quests, UGC Moderation, and Discord Events is labeled **Community** (formerly "Verse Backoffice").
- **Config**: `verseBackofficeItems` in `apps/web/lib/sidebar-config.tsx` defines the Community group items.
