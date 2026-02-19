# Dojo Section

The Dojo is the members' **private hub** in the MNKY VERSE—more exclusive than the public storefront. Each authenticated user has access to their own Dojo at `/dojo`.

## Route Structure

| Path | Description |
|------|-------------|
| `/dojo` | Main hub—overview, quick links to preferences and Verse |
| `/dojo/preferences` | User preferences (default agent, etc.) |

## Auth Model

- **Auth required:** All Dojo routes require authentication. Unauthenticated users are redirected to `/auth/login`.
- **Member access:** Non-admin authenticated users can access `/dojo` alongside `/verse`.
- **No public Dojo paths:** Unlike Verse, which has public paths (glossary, formulas, etc.), Dojo is fully private.

## Layout and Components

- **Layout:** `app/dojo/layout.tsx`—SidebarProvider, DojoSidebar, SidebarInset
- **Sidebar:** `components/dojo/dojo-sidebar.tsx`—collapsible icon sidebar (shadcn pattern)
- **Nav config:** `lib/dojo-sidebar-config.tsx`
- **Auth:** `components/dojo/dojo-auth-context.tsx`—server-side user fetch and redirect

## Design

Dojo uses root design tokens (see [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)). The `.dojo-dashboard` class wraps main content for consistent layout. No Dojo-specific CSS tokens for MVP.

## Migration

- Legacy `/verse/dojo` redirects to `/dojo`.
- Preferences (default agent) migrated to `app/dojo/preferences`.
