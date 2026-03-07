# Dashboard-01 (shadcn) Integration Plan

**Context:** `npx shadcn@latest add dashboard-01` was run in the portal. It added a sidebar-based dashboard layout and overwrote `app/dashboard/page.tsx`. This plan integrates that UI with the portal’s auth, orgs, and navigation.

---

## 1. Current state

| Item | What exists |
|------|-------------|
| **Root layout** | `HeaderNav` + `main` + `PortalFooter` on every page. |
| **Dashboard page** | New dashboard-01: `SidebarProvider` → `AppSidebar` + `SidebarInset` → `SiteHeader` + `SectionCards` + `ChartAreaInteractive` + `DataTable(data.json)`. |
| **AppSidebar** | Hardcoded “Acme Inc.”, nav (Dashboard, Lifecycle, Analytics, Projects, Team), documents, Settings/Get Help/Search, `NavUser` with “shadcn” / m@example.com. |
| **SiteHeader** | Sidebar trigger + “Documents” title. |
| **Content** | Placeholder cards (revenue, customers), chart, and table from `data.json`. |
| **Portal needs** | Auth-protected dashboard; list of user’s organizations (→ `/t/[slug]`); Create org; Admin (platform_admin); Profile; real user in sidebar; optional backoffice entry. |

---

## 2. Goals

- Keep dashboard-01 **layout and shell** (sidebar + main content).
- **Protect** `/dashboard`: require auth, redirect to login if not signed in.
- **Wire sidebar and header** to portal: real user, orgs, Dashboard / Admin / Profile / Sign out.
- **Replace placeholder content** with portal-specific blocks: org list, Create org, and (for admins) Backoffice.
- **Avoid double chrome**: decide how global `HeaderNav` and dashboard sidebar coexist (see options below).

---

## 3. Option: Global header vs dashboard-only

- **A. Keep both**  
  Root layout keeps `HeaderNav`; dashboard page keeps sidebar. Result: top nav + collapsible sidebar on `/dashboard`. Easiest; slight redundancy.

- **B. Dashboard layout hides top nav**  
  Add `app/dashboard/layout.tsx` that renders only the sidebar shell (no `HeaderNav`). Root layout still wraps with `HeaderNav`; you’d conditionally hide `HeaderNav` for `/dashboard` (e.g. pathname in a client wrapper), or make the dashboard layout a custom shell that doesn’t render the root `<main>` content and instead replaces the whole content area. More work, single “app” feel on dashboard.

- **C. Sidebar only on dashboard**  
  Same as B but explicitly: on `/dashboard` the only nav is the sidebar; other routes keep `HeaderNav`. Requires one layout or conditional in root.

**Recommendation:** Start with **A** (keep both). If you want a cleaner dashboard-only experience later, add **B** (dashboard layout that omits or overrides the global header for `/dashboard`).

---

## 4. Implementation plan

### 4.1 Auth and redirect

- In `app/dashboard/page.tsx` (or a new `app/dashboard/layout.tsx`), use server-side auth:
  - `createClient()` from `@/lib/supabase/server`, `getUser()`.
  - If no user, `redirect("/auth/login")`.
- Optionally pass `user` (and later `profile` / `platform_role`) into client components that need them (e.g. sidebar, header).

**Files:** `app/dashboard/page.tsx` or `app/dashboard/layout.tsx`.

---

### 4.2 Dashboard layout (optional but useful)

- Add `app/dashboard/layout.tsx` that:
  - Runs auth; redirects to `/auth/login` if unauthenticated.
  - Fetches user’s organizations (same as profile: `tenant_members` + `tenants(id, slug, name)`).
  - Fetches `profiles.platform_role` for current user (for Admin visibility).
  - Renders `SidebarProvider` + `AppSidebar` + `SidebarInset` once, and passes orgs + user + `isPlatformAdmin` via context or props.
  - Renders `children` inside `SidebarInset` (so the dashboard page only renders the main content, not the shell).

Then `app/dashboard/page.tsx` only contains the main content (cards + org list + optional chart/table).

**Files:** `app/dashboard/layout.tsx`, optionally a small `DashboardContext` or prop drilling to sidebar/header.

---

### 4.3 Portal-specific AppSidebar

- **Replace** hardcoded `data` in `app-sidebar.tsx` with props or context:
  - **User:** `{ name, email, avatar }` from Supabase user + profile (e.g. `user_metadata.full_name` or `profiles.display_name`, `user.email`, `profiles.avatar_url`).
  - **Nav main items:**  
    Dashboard (current, `/dashboard`),  
    Your organizations (or “Organizations”) → could link to `/dashboard` with anchor or a dedicated “My orgs” view),  
    Create organization → `/onboarding`,  
    Admin → `/admin` (only if `platform_role === 'platform_admin'`),  
    Profile → `/profile`.
  - **Nav secondary:** Settings (e.g. `/profile` or `/settings`), Get Help (link or external), Search (existing semantic search or link to dashboard with search).
  - **Documents:** Either remove, or repurpose as “Resources” / “Org apps” (e.g. Data Library → link to first org’s Flowise/n8n or a generic docs link).
  - **Sidebar header:** Replace “Acme Inc.” with “MOOD MNKY Portal” or app name; link to `/dashboard` or `/`.

- **NavUser:** Keep dropdown; wire “Account” → `/profile`, “Log out” → `signOut` + `router.push("/")` (reuse logic from `header-nav.tsx`). Remove or repurpose “Billing” / “Notifications” if not in scope.

**Files:** `components/app-sidebar.tsx`, `components/nav-user.tsx` (accept `user`, `onSignOut`).

---

### 4.4 SiteHeader

- Replace “Documents” with “Dashboard” or a dynamic title (e.g. “Your organizations” when on dashboard home).
- Optionally add the portal’s `SemanticSearchBar` next to the sidebar trigger (or in the sidebar footer) so search is available without the global header.

**Files:** `components/site-header.tsx`.

---

### 4.5 Main content: replace placeholders

- **SectionCards (top cards):**
  - Card 1: “Your organizations” — count of user’s orgs (from layout/page data).
  - Card 2: “Create organization” — CTA button → `/onboarding`.
  - Card 3 (if admin): “Backoffice & config” — CTA → `/admin` or open backoffice dialog.
  - Optional fourth: e.g. “Pending invites” if you have invite data.

- **ChartAreaInteractive:**
  - Keep for future analytics (e.g. usage per org), or remove and leave a single “Activity” or “Coming soon” block.

- **DataTable:**
  - **Replace** `data.json` with a list of the user’s organizations:
    - Columns: Organization name, Slug, Role (from `tenant_members.role`), Action (e.g. “Open” → `/t/[slug]`).
    - Data source: same `tenant_members` + `tenants` query as in profile (and layout).
  - Alternatively use a **card grid** of orgs (like tenant page cards) instead of the table; keep the table component for reuse elsewhere.

**Files:** `app/dashboard/page.tsx`, `components/section-cards.tsx` (or a new `SectionCardsPortal.tsx`), optionally a new `OrganizationsTable.tsx` or `OrganizationsCardGrid.tsx` that takes `tenants: { id, slug, name }[]` and memberships for role.

---

### 4.6 Data flow

- **Server (layout or page):**
  - Auth + redirect.
  - Fetch: `tenant_members` + `tenants(id, slug, name)` for current user; `profiles(display_name, avatar_url, platform_role)`.
- **Client:**
  - Sidebar and NavUser receive user + orgs + isPlatformAdmin (and onSignOut).
  - Main content receives orgs (+ roles) for cards and table/grid.

---

### 4.7 Cleanup and polish

- Remove or archive `app/dashboard/data.json` if no longer used (or keep for dev/demo).
- Ensure `Toaster` (Sonner) is in root layout if any dashboard actions show toasts.
- If you use a dashboard-specific layout, ensure `HeaderNav` “Dashboard” link stays active on `/dashboard` and that mobile behavior (sidebar offcanvas) is still correct.
- Optional: add a small “Dashboard” breadcrumb in `SiteHeader` (e.g. Dashboard > Your organizations).

---

## 5. Suggested order of work

1. **Auth + layout** — Add `app/dashboard/layout.tsx` with auth redirect and data fetch (orgs, profile, platform_role); move shell (SidebarProvider + AppSidebar + SidebarInset) into layout; leave page as content only.
2. **Sidebar and user** — Replace AppSidebar data with props/context; wire NavUser to real user and sign-out.
3. **SiteHeader** — Update title and optionally add search.
4. **Section cards** — Replace with portal cards (org count, Create org, Backoffice for admin).
5. **Org list** — Replace DataTable (or add a card grid) with user’s organizations and links to `/t/[slug]`.
6. **Chart** — Keep as placeholder or remove.
7. **Testing** — Logged-in user sees orgs and links; admin sees Admin in sidebar and Backoffice card; sign out works from sidebar.

---

## 6. Files to add or touch

| Action | File |
|--------|------|
| Add | `app/dashboard/layout.tsx` (auth, data fetch, shell) |
| Edit | `app/dashboard/page.tsx` (content only: cards + org list/chart) |
| Edit | `components/app-sidebar.tsx` (portal nav, real user, orgs) |
| Edit | `components/nav-user.tsx` (real user, sign out, Profile link) |
| Edit | `components/site-header.tsx` (title, optional search) |
| Edit / replace | `components/section-cards.tsx` or new `SectionCardsPortal.tsx` |
| Add or edit | Org list: `OrganizationsTable.tsx` or reuse DataTable with org data |
| Optional | Remove or keep `app/dashboard/data.json`, `ChartAreaInteractive` |

---

## 7. Summary

- **Keep:** Sidebar shell, SidebarProvider, layout structure, UI components (sidebar, cards, table).
- **Replace:** All hardcoded “Acme” / “shadcn” data with Supabase user, profile, and tenant membership data.
- **Add:** Auth guard, org list (table or cards), portal nav items, and Backoffice entry for platform admins.

This yields a single, consistent dashboard that lists the user’s organizations and links to tenant pages, onboarding, profile, and (for admins) backoffice, using the new dashboard-01 layout.
