# Dojo Profile Page Redesign

## Design Research Summary

### 1. Profile and account-settings UX

- **Grouping and hierarchy:** Profile/settings pages benefit from clear section grouping (identity, account, preferences, linked services, activity). Users scan in F-pattern; primary identity and key stats should sit in the upper-left or top band.
- **Horizontal space:** Single-column narrow layouts (e.g. max-w-lg) underuse space on large screens. Multi-column or dashboard-style layouts improve scanning and reduce scroll when sections are grouped into a grid.
- **When to use dashboard vs single column:** Dashboard-style grids work well when the page has multiple distinct sections (cards) that do not depend on a strict linear flow. Account/settings with 5+ sections are good candidates for 2–3 column grids on large viewports.

### 2. Dashboard-style layout for settings

- **Summary cards:** A compact “profile snapshot” or hero at the top (avatar, name, level, XP, linked badges) gives immediate context and matches the Dojo home pattern (Welcome hero + Character/XP/Quests cards).
- **Section grids:** Use responsive grid (e.g. `md:grid-cols-2`, `xl:grid-cols-3`) so sections stack on mobile and sit side-by-side on desktop.
- **Accessibility:** Preserve semantic headings (h1, h2), labels on form controls, and focus states. Grid layout is presentational; order in DOM should remain logical for screen readers.

### 3. Dojo design consistency

- Dojo uses **root design tokens** (see `docs/DESIGN-SYSTEM.md`): `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `primary`. No verse-* tokens in Dojo.
- Existing components: **DojoProfileSnapshot** (avatar, name, handle, level, XP, “Profile & account” link), **DojoCharacterCard** (Agent wrapper with avatar, name, level), **DojoXpCard** (level, XP, “View Profile” link). Profile page should reuse or extend DojoProfileSnapshot for the hero and use the same Card/Badge/Button patterns as Dojo home.
- Layout should mirror Dojo home: full-width container, optional hero/snapshot row, then grid of cards with consistent gap (e.g. gap-4, gap-6).

### 4. Space utilization

- Dojo home uses `flex flex-1 flex-col gap-6 p-4 pt-0` with no max-width; a 4-card grid and a “Your space” block with AnimatedGridPattern. Profile page was constrained by `max-w-[var(--verse-page-width)]` and inner `max-w-lg`, leaving most of the screen empty.
- **Decision:** Remove all max-width constraints on the profile content wrapper. Use full width with the same padding as Dojo home. Arrange sections in a responsive grid (2–3 columns) so the profile uses horizontal space like the dashboard home.

---

## Layout Decisions

| Area | Decision |
|------|----------|
| Page wrapper | Full width, `flex flex-1 flex-col gap-6 p-4 pt-0` (match Dojo home). |
| Back nav | “Back to Dojo” link at top (keep existing). |
| Hero | Reuse **DojoProfileSnapshot** or an extended variant: avatar, display name, handle, level, XP, linked badges (Shopify, etc.). Single card or full-width bar. |
| Sections | Identity, Account, Preferences, Linked accounts, Activity, My Tracks, Dojo links — each in a shadcn Card. |
| Grid | `grid gap-4 md:grid-cols-2 xl:grid-cols-3` for the section cards. |
| Tokens | Root only; no verse-* classes in Dojo profile. |
| Responsive | One column on small screens; 2–3 columns on md/xl. |

---

## Implementation Notes

- **DojoProfileClient** is a new client component that receives the same data as VerseProfileClient and renders the Dojo layout (hero + grid) with root tokens.
- **VerseProfileClient** is unchanged and remains used only on the Verse storefront profile route.
- Profile update and avatar upload logic reuse the existing server action `updateProfile` from `app/(storefront)/verse/profile/actions.ts` (it already revalidates `/dojo/profile`).

---

## Implementation Summary

- **Dojo profile page** (`apps/web/app/dojo/profile/page.tsx`): Full-width layout (`gap-6 p-4 pt-0`), Back link, and `DojoProfileClient`; no max-width wrapper.
- **DojoProfileClient** (`apps/web/components/dojo/dojo-profile-client.tsx`): Root tokens only; Profile h1 + description; `DojoProfileSnapshot` as hero with `showProfileLink={false}`; responsive grid `md:grid-cols-2 xl:grid-cols-3` for Identity, Account, Preferences, Linked accounts, Activity, My Tracks, Dojo links. Reuses `updateProfile` from Verse profile actions.
- **DojoProfileSnapshot** (`apps/web/components/dojo/dojo-profile-snapshot.tsx`): Optional `showProfileLink` prop (default `true`); when `false`, the "Profile & account" link is hidden for use on the profile page.
- **VerseProfileClient** is unchanged and used only on the Verse storefront profile route.
