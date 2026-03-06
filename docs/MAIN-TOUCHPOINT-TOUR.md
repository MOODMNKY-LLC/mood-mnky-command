# Main Touch-Point Tutorial

A short, optional tutorial orients first-time visitors to www.moodmnky.com and `/main` so they can find the Dojo, sign up, and main entry points.

## Overview

- **Format:** Modal overlay with 5 steps, progress indicator, and Next / Back / Skip.
- **Scope:** Main section only (`/main` and `/main/*`). Dojo and LABZ have separate onboarding.
- **Trigger:** First visit to `/main` (if not seen before) or "Take a tour" in the nav or footer.

## Steps (copy)

1. **Welcome** — "This is MOOD MNKY — your home for bespoke fragrance and the Dojo."
2. **Enter the Dojo** — "Enter the Dojo to shop, blend, and explore. Use the Dojo link in the nav or the button below." (Optional "Open Dojo" → `/verse`.)
3. **Create an account** — "Create an account to save your blends and shop. Sign up is in the top right and in the hero." (Optional "Sign up" → `/auth/sign-up`.)
4. **Discover** — "Use Explore and About in the nav for fragrances, formulas, and our story."
5. **You're set** — "You can revisit this anytime via \"Take a tour\" in the footer or nav."

## Storage and persistence

- **Key:** `main-touchpoint-tour-seen` (localStorage).
- **When set:** On Skip, Finish (last step), or closing the modal (Escape or outside click).
- **Effect:** The tour does not auto-show again on later visits. Users can always open it manually via "Take a tour" in the nav or footer.

## Triggers

| Trigger | Behavior |
|--------|----------|
| First visit to `/main` | If `main-touchpoint-tour-seen` is not set, the tour opens after a short delay (~1s). |
| "Take a tour" (nav) | Opens the tour from step 1 (desktop and mobile menu). |
| "Take a tour" (footer) | Opens the tour from step 1 (Discover group). |

## How to reopen

- Click **Take a tour** in the main nav (desktop or mobile menu).
- Click **Take a tour** in the main footer under Discover.

Clearing localStorage (e.g. `localStorage.removeItem('main-touchpoint-tour-seen')`) will allow the first-visit auto-show to run again on the next visit to `/main`.

## Implementation

| Area | File / detail |
|------|----------------|
| Context | [apps/web/components/main/main-touchpoint-tour-context.tsx](apps/web/components/main/main-touchpoint-tour-context.tsx) — `MainTouchpointTourProvider`, `useMainTouchpointTour()`. |
| Tour UI | [apps/web/components/main/main-touchpoint-tour.tsx](apps/web/components/main/main-touchpoint-tour.tsx) — `MainTouchpointTour` (Dialog, steps, progress, Next/Back/Skip). |
| Layout | [apps/web/app/(main)/main/layout.tsx](apps/web/app/(main)/main/layout.tsx) — Wraps with `MainTouchpointTourProvider` and renders `MainTouchpointTour`. |
| Nav | [apps/web/components/main/main-nav.tsx](apps/web/components/main/main-nav.tsx) — "Take a tour" button calls `openTour()`. |
| Footer | [apps/web/components/main/main-footer.tsx](apps/web/components/main/main-footer.tsx) — "Take a tour" in Discover group. |

## Accessibility

- Dialog is keyboard-navigable and focus is trapped while open.
- Escape closes the modal and marks the tour as seen.
- Step and actions are announced for screen readers (progress text, Skip/Back/Next).
