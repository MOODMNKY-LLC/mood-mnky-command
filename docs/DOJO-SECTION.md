# Dojo Section

The Dojo is the members' **private hub** in the MNKY VERSE—more exclusive than the public storefront. Each authenticated user has access to their own Dojo at `/dojo`.

## Dashboard-07 Alignment

The Dojo sidebar and layout follow the `temp/dashboard-07` pattern (sidebar-07 block):

- **DojoSidebar:** Forwards `...props` to Sidebar, uses `collapsible="icon"`, SidebarRail
- **DojoTeamSwitcher:** Dropdown with teams, "Switch to Verse" link, `useSidebar().isMobile` for positioning
- **DojoNavMain:** SidebarGroup + Collapsible items with sub-menus; flat items use `Link`
- **DojoNavProjects:** SidebarMenuAction + DropdownMenu per item (View/Share); "More" button; `group-data-[collapsible=icon]:hidden`
- **DojoSidebarFooter:** NavUser-style dropdown (avatar, name, email, Profile, Preferences, Sign out)
- **Header:** Breadcrumb (The Dojo > current page), SidebarTrigger, `group-has-data-[collapsible=icon]/sidebar-wrapper:h-12` transition

## Route Structure

| Path | Description |
|------|-------------|
| `/dojo` | Main hub—XP/level, quests, quick actions, manga/UGC entry points |
| `/dojo/preferences` | User preferences (default agent, etc.) |

## Gamification Integration

The Dojo home page surfaces XP, quests, manga, and UGC per [PRD-Gamification-MNKY-VERSE.md](./PRD-Gamification-MNKY-VERSE.md), [PRD-Collection-Manga-Magazine.md](./PRD-Collection-Manga-Magazine.md), and [MAG-XP-RULES.md](./MAG-XP-RULES.md):

- **XP / Level card:** Fetches from `xp_state`, links to `/verse/profile`
- **Quests card:** Fetches active quests + `quest_progress` completed count, links to `/verse/quests`
- **Quick actions:** Preferences, MNKY VERSE Shop, Chat, Issues, UGC
- **Lower section:** Manga/Issues and UGC entry points linking to `/verse/issues` and `/verse/ugc`

**Companion & Manga (Phase 4):** To highlight a “Current issue” or Riftbound collection, the Dojo home can show a featured issue (e.g. first published issue by slug or a config-driven slug) with a direct link to `/verse/issues/[slug]`. Reuse existing manga cards in `DojoLowerSection`; optional: add a “Current issue” or “Riftbound” quick link in [lib/dojo-sidebar-config.tsx](../lib/dojo-sidebar-config.tsx) or the quick-actions area when a featured issue exists. See [COMPANION-MANGA-ROADMAP.md](COMPANION-MANGA-ROADMAP.md).

APIs: `GET /api/xp/state`, `GET /api/quests`, `GET /api/quests/my-progress`

## Auth Model

- **Auth required:** All Dojo routes require authentication. Unauthenticated users are redirected to `/auth/login`.
- **Member access:** Non-admin authenticated users can access `/dojo` alongside `/verse`.
- **No public Dojo paths:** Unlike Verse, which has public paths (glossary, formulas, etc.), Dojo is fully private.

## Layout and Components

- **Layout:** `app/dojo/layout.tsx`—DojoAuthContext + DojoDashboardLayout
- **Dashboard layout:** `components/dojo/dojo-dashboard-layout.tsx`—SidebarProvider, DojoSidebar, SidebarInset, Breadcrumb header
- **Sidebar:** `components/dojo/dojo-sidebar.tsx`—shadcn sidebar-07 block (collapsible icon, team switcher, nav groups, quick access, user footer)
- **Sidebar subcomponents:** DojoTeamSwitcher, DojoNavMain, DojoNavProjects, DojoSidebarFooter
- **Nav config:** `lib/dojo-sidebar-config.tsx`—dojoNavGroups, dojoQuickAccessItems, dojoTeams
- **Page cards:** DojoXpCard, DojoQuestsCard, DojoQuickActionsCard, DojoLowerSection
- **Auth:** `components/dojo/dojo-auth-context.tsx`—server-side user fetch and redirect

## Design

Dojo uses root design tokens (see [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)). The `.dojo-dashboard` class wraps main content for consistent layout. No Dojo-specific CSS tokens for MVP.

## Migration

- Legacy `/verse/dojo` redirects to `/dojo`.
- Preferences (default agent) migrated to `app/dojo/preferences`.
