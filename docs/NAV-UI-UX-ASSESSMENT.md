# Main Nav & Cross-Surface Navigation — UI/UX Assessment

Assessment of main nav logic on `/main` and other surfaces for UI/UX, structure by use case, and clutter reduction. Inputs: **MOOD MNKY** (brand/UX), **SAGE MNKY** (information architecture), **CODE MNKY** (implementation/consistency).

---

## 1. Brand & UX (MOOD MNKY)

### Current state

- **Main nav:** Logo | Search (center) | Theme/Palette | **Collections** (Shop, Fragrances, Formulas) | **About** (About, Design, Media) | Dojo, Services, Loyalty, Community | Sign in / Sign up. All right-side items share the same visual weight.
- **Verse (Dojo) header:** Brand + “MNKY DOJO” | Home, Explore, Blog, Agents, Shop, Rewards, Dojo (when user) | Cart, XP, user, theme.
- **Dojo sidebar:** Grouped by context (MOOD MNKY Home, Dojo Home, Home, Chat, Profile, Preferences).
- **Main footer:** Single row — Sign up, About, MNKY DOJO, Blog, Docs, OpenInChat. No grouping.

### Issues

- **Weak hierarchy:** “What we offer” (Collections, About, Services, Loyalty, Community) and “where to go” (Dojo) sit at the same level; Dojo doesn’t read as the primary action.
- **Clutter:** Seven nav items plus theme and auth feels busy for a minimalist brand; no grouping by intent.
- **Mixed mental models:** Collections = catalog, About = story, Dojo = destination, Services/Loyalty/Community = programs — not surfaced in the structure.
- **Footer mismatch:** Flat list with no grouping or alignment with nav.

### MOOD MNKY recommendations

1. **Separate “Discover” from “Go”** — Structure into **(1) Discover** (what we offer: Collections + About or one “Discover” dropdown) and **(2) Go** (one clear next step: Dojo). Treat Dojo as the primary destination.
2. **Elevate Dojo as primary CTA** — Give Dojo distinct treatment (e.g. button or stronger weight) or place it first in the “Go” group; align tooltip/copy with Dojo header/sidebar.
3. **Reduce top-level items** — Fold Services, Loyalty, Community into About or a “More” / “Programs” dropdown. Aim for three concepts: **Collections**, **About** (or Discover), **Dojo**, plus theme and auth.
4. **Group main footer by use case** — e.g. **Discover** (About, Blog, Docs), **Dojo** (Enter Dojo, Sign up), **Connect** (OpenInChat). Use headings or spacing so the footer mirrors the nav.
5. **One consistent “Dojo” label** — Same label in Main nav and footer; match Dojo header/sidebar so “Main = brand, Dojo = place to shop and blend” is consistent.

---

## 2. Information Architecture & Use-Case (SAGE MNKY)

### Fit by location

- **Main:** Mix of Collections, About, Dojo, Services, Loyalty, Community blurs “discover” (brand, story) with “act” (shop, services) and “belong” (community, loyalty, Dojo). Narrative role of the brand site is diluted.
- **Verse:** Home, Explore, Blog, Agents, Shop, Rewards, Dojo, Cart fits browse/shop/belong but has many top-level items; could be grouped.
- **Dojo:** Sidebar intent is clear; remaining risk is “Dojo” meaning both public storefront and member area on different surfaces.

### Redundancy and cognitive load

- **Two “Dojo” entry points:** On Main, “Dojo” may go to storefront or member hub depending on product choice; in Verse/Dojo UI “Dojo” is member hub. Same label for two places increases cognitive load.
- **About vs Services vs Community:** All sit as siblings; “what we offer” (Services) could live under About; Community overlaps with “belong” (Loyalty, Dojo). Flat IA doesn’t guide by intent.
- **Main nav density:** Many visible choices; discover/brand gets lost among action and belonging.

### Organizing principle: discover / act / belong

- **Discover** — About, Design, Media; optionally Services.
- **Act** — Shop/storefront (one clear entry), Collections.
- **Belong** — Community, Loyalty, Sign up; member Dojo when signed in.

### SAGE MNKY recommendations

1. **Resolve double “Dojo” label** — Use distinct labels: e.g. **“Shop” or “Enter the Dojo”** on Main → storefront; **“My Dojo” or “Member Hub”** in Verse/Dojo → member area. One label per destination.
2. **Group Main nav by discover / act / belong** — Three groups (e.g. Discover; Shop/Dojo; Join/Community) with fewer top-level items so the brand site reads “discover first, then act, then belong.”
3. **Fold Services into Discover/Offer** — Place Services under About/Design/Media (one “About” or “Discover” menu) or one “Offer” cluster; remove as standalone.
4. **Treat Community and Loyalty as one “Belong” cluster** — One “Join” or “Community” area (dropdown) with Community, Loyalty, Sign up.
5. **Simplify Verse header** — Group Explore, Blog, Agents under one “Discover” or “Explore” dropdown so Verse has fewer top-level items.

---

## 3. Implementation & Consistency (CODE MNKY)

### Maintainability

- **Main nav:** Link data is single source within the file (`COLLECTIONS_LINKS`, `ABOUT_LINKS`, `NAV_LINKS`); desktop and mobile both use these arrays.
- **Cross-surface:** No shared config; main footer and verse header/footer have their own links. Changing a shared link (Dojo, Blog, About) requires edits in multiple files.
- **Markup duplication:** Desktop and mobile in `main-nav.tsx` each have full copies of Collections and About dropdowns; only data is shared.

### Inconsistencies

- **Dojo href:** Main nav “Dojo” and main footer “MNKY DOJO” point to `/dojo`. Verse header “MNKY DOJO” points to `/dojo/me`. Main → portal home, verse → member home; document this intent.
- **Labels:** Main nav “Dojo” vs footer “MNKY DOJO” for the same destination.

### CODE MNKY recommendations

1. **Shared main-site link config** — Add `apps/web/lib/main-nav-config.ts` (or similar) exporting `COLLECTIONS_LINKS`, `ABOUT_LINKS`, `NAV_LINKS`, and optional footer links. Import in `main-nav.tsx` and `main-footer.tsx`.
2. **Single dropdown block in main-nav** — Extract `MainNavCollectionsDropdown` / `MainNavAboutDropdown` that take the link array and optional `onNavigate`; render once for desktop and once for mobile to avoid duplicated markup.
3. **Canonical route constants** — Add `apps/web/lib/nav-routes.ts` with e.g. `ROUTES.DOJO`, `ROUTES.DOJO_ME`, `ROUTES.MAIN_ABOUT` and use in main nav, footer, and (optionally) verse. Makes `/dojo` vs `/dojo/me` explicit.
4. **Per-surface nav config** — Optional: `getMainNavLinks()`, `getVerseHeaderLinks()`, `getDojoSidebarLinks()` using shared route constants and shared link definitions where appropriate.
5. **Document Dojo entry points** — One-line note: “Main nav and footer link to `/dojo` (portal); verse header brand link goes to `/dojo/me` (member home).”

---

## 4. Summary & suggested next steps

| Theme | Main takeaway |
|--------|----------------|
| **Brand/UX** | Separate Discover vs Go; elevate Dojo; reduce top-level items; group footer. |
| **IA** | Use discover / act / belong; one label per destination (resolve “Dojo”); fold Services and group Community/Loyalty. |
| **Code** | Shared main link config; single dropdown component; route constants; document Dojo entry points. |

**Suggested next steps**

1. **Product decision:** Should Main “Dojo” go to storefront (`/verse`) or member portal (`/dojo`)? Then use distinct labels (e.g. “Shop” / “Enter the Dojo” vs “My Dojo”) so one word never means two places.
2. **Restructure Main nav** around discover / act / belong: e.g. **Collections** + **About** (About, Design, Media, Services) + **Dojo** (or Shop) + **Join** (Community, Loyalty, Sign up), with Dojo visually elevated.
3. **Refactor for consistency:** shared `main-nav-config.ts`, route constants, and extracted dropdown components; update footer to use same config and grouped layout.
4. **Optionally** simplify Verse header with a Discover/Explore dropdown.

Context and surface details: `docs/NAV-ASSESSMENT-CONTEXT.md`. Existing navigation report: `docs/NAVIGATION-UX-REPORT.md`.

---

## 5. Implementation (completed)

All recommended and optional steps have been implemented.

### Dojo entry points (canonical)

| From | Label | Destination | Purpose |
|------|--------|-------------|--------|
| Main nav | **Enter the Dojo** | `/verse` (STOREFRONT) | Storefront: shop and blend. Primary CTA from brand site. |
| Main footer | **Enter Dojo** | `/verse` | Same as above. |
| Verse header (brand) | **MNKY DOJO** | `/dojo/me` (DOJO_ME) | Member home when already in storefront. |
| Verse header (when signed in) | **My Dojo** | `/dojo/me` | Member hub: profile, chat, crafting. |

So: **one label per destination** — “Enter the Dojo” / “Enter Dojo” = storefront; “My Dojo” / “MNKY DOJO” (in header) = member hub.

### Files changed or added

- **`apps/web/lib/nav-routes.ts`** — New. Canonical route constants; Dojo entry points documented in file comment.
- **`apps/web/lib/main-nav-config.ts`** — New. Shared COLLECTIONS_LINKS, ABOUT_LINKS (incl. Services), JOIN_LINKS, DOJO_CTA, FOOTER_GROUPS.
- **`apps/web/components/main/main-nav.tsx`** — Uses config and ROUTES; MainNavDropdown component; structure: Collections, About, **Enter the Dojo** (elevated button), Join, Auth.
- **`apps/web/components/main/main-footer.tsx`** — Uses config; grouped layout: **Discover** (About, Blog, Docs), **Dojo** (Enter Dojo, Sign up), **Connect** (OpenInChat).
- **`apps/web/components/verse/verse-header.tsx`** — **Discover** dropdown (Explore, Blog, Agents); “Dojo” → **My Dojo** with title “My Dojo (member hub)”; Dojo entry points in file comment.
