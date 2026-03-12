# Performance and speed

## Lighthouse baseline

Run Lighthouse (Chrome DevTools → Lighthouse, or `npx lighthouse`) on key routes to establish a baseline and track improvements:

- **Routes to test:** `/`, `/main`, `/dojo`, `/auth/login`, one dashboard route (e.g. `/platform`), one verse page (e.g. `/dojo/products`).
- **Metrics to record:** LCP (Largest Contentful Paint), TBT (Total Blocking Time), CLS (Cumulative Layout Shift).
- **Device:** Use "Mobile" preset for mobile speed; compare with "Desktop" if needed.

## Practices in this codebase

- **Dynamic imports:** Heavy or below-the-fold components (Globe, FullPageChat, DojoFlowiseChatbot on chat pages) are loaded with `next/dynamic` and `ssr: false` where appropriate to reduce initial JS.
- **Images:** Next.js `Image` with custom Supabase loader; `sizes` and `priority` are set on hero and product images to avoid oversized requests on mobile.
- **PWA (Serwist):** Precache is limited to entry URLs (`/`, `/verse`, `/dojo`, `/main`, `/~offline`). Runtime cache uses Serwist `defaultCache`. See `apps/web/app/sw.ts` and `next.config.mjs` (withSerwist).

## Re-running audits

After mobile or speed changes, re-run Lighthouse on the same URLs and compare LCP, TBT, and CLS. Use the same device/throttling for comparable results.

---

## PWA (install and offline)

- **Install prompt:** A single shared prompt (`PwaInstallPrompt`) is rendered in the root layout and appears on Main, Dojo, and LABZ when the app is not already installed and the user has not dismissed it recently. Copy is MOOD MNKY–aligned; buttons use 44px minimum touch targets.
- **Offline:** The service worker (Serwist) serves a fallback document at `/~offline` for navigation requests when offline. The offline page uses brand tone, a "Try again" button, and a "Go home" link (to `/`, which is precached).
- **Manifest:** `app/manifest.ts` defines `short_name`, icons, `display`, and `display_override` for standalone/splash behavior. Theme color matches the app (e.g. `#f1f5f9`). See `docs/DESIGN-SYSTEM.md` for palette and tokens.
