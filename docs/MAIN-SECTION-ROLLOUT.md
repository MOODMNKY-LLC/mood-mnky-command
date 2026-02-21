# Main Section – Testing and Rollout

This document describes how to test host-based routing and the Main section locally and on preview, and how to roll out www.moodmnky.com to production.

## Local testing (hosts file)

Host-based routing uses the `Host` header. To test each domain locally:

1. **Edit hosts file** (run as Administrator on Windows, or use `sudo` on macOS/Linux):

   **Windows:** `C:\Windows\System32\drivers\etc\hosts`  
   **macOS/Linux:** `/etc/hosts`

   Add:

   ```
   127.0.0.1 mnky-verse.moodmnky.com
   127.0.0.1 mnky-command.moodmnky.com
   127.0.0.1 www.moodmnky.com
   127.0.0.1 moodmnky.com
   ```

2. **Start the app:** From repo root, `pnpm dev` (app runs at http://localhost:3000).

3. **Test each host:**
   - **http://mnky-command.moodmnky.com:3000** – Should show LABZ (dashboard) at root. If not logged in, redirects to `/auth/login`.
   - **http://mnky-verse.moodmnky.com:3000** – Should show MNKY VERSE (root path rewritten to `/verse`).
   - **http://www.moodmnky.com:3000** – Should show Main landing (root path rewritten to `/main`). No auth required.
   - **http://moodmnky.com:3000** – Same as www (Main).

4. **Verify:** Main site shows "MOOD MNKY – Fragrance, Community, Innovation" and CTAs to Verse and Sign in. Verse and Labz behave as before (auth, role redirects).

**Note:** Port 3000 must be included in the URL when using hosts file (e.g. `http://www.moodmnky.com:3000`). Browsers use port 80 by default if omitted.

## Preview deployments (Vercel)

Preview URLs (e.g. `project--branch.vercel.app`) do not match `mnky-verse.moodmnky.com` or `www.moodmnky.com`. The proxy does **not** rewrite for preview hosts, so:

- Preview deployments behave like the default domain: root is LABZ; unauthenticated users are redirected to login.
- To test Main or Verse routing on a branch, use production-like domains (e.g. after merging to main and deploying) or use the hosts file locally with `pnpm dev`.

Optional: To test a section on preview, you could add a query parameter (e.g. `?section=main`) and have the proxy rewrite when that param is present; this is not implemented by default.

## SEO and canonical

- **Main layout** sets `metadataBase` and `alternates.canonical` using `NEXT_PUBLIC_MAIN_APP_URL` (fallback `https://www.moodmnky.com`). Each Main page can override `metadata` with its own title/description.
- **Sitemap:** The app does not currently expose a sitemap. If you add one (e.g. `app/sitemap.ts`), include `/main`, `/main/about`, `/main/contact`, `/main/pricing` and use `NEXT_PUBLIC_MAIN_APP_URL` as the base URL for those entries so canonical URLs point to www.moodmnky.com.

## Rollout checklist

1. **Code and config**
   - [ ] Merge branch with Main section, proxy rewrite, and docs.
   - [ ] Set `NEXT_PUBLIC_MAIN_APP_URL=https://www.moodmnky.com` in Vercel (Production and Preview if desired).

2. **Vercel**
   - [ ] Add **www.moodmnky.com** as a custom domain to the project (Settings → Domains).
   - [ ] Optionally add **moodmnky.com** (redirect to www or both pointing to same deployment).
   - [ ] Deploy and verify production build.

3. **DNS**
   - [ ] Point **www.moodmnky.com** (CNAME or A) to Vercel as per Vercel’s domain instructions.
   - [ ] Verify SSL and domain status in Vercel.

4. **Supabase**
   - [ ] Add redirect URLs for www (see [MAIN-SECTION-SUPABASE-AUTH.md](MAIN-SECTION-SUPABASE-AUTH.md)).

5. **Shopify**
   - [ ] Add Customer Account API callback and JavaScript origin for www if Main will trigger login (see [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md)).

6. **Theme**
   - [ ] Push or re-apply footer changes (Main site link) if the theme was customized in the editor after the repo update.

7. **Smoke test**
   - [ ] Open https://www.moodmnky.com – Main landing loads, no auth required.
   - [ ] Open https://mnky-verse.moodmnky.com – Verse loads.
   - [ ] Open https://mnky-command.moodmnky.com – LABZ or login.
   - [ ] From Main, click "Join MNKY VERSE" and "Sign in" – correct destinations.

8. **Marketing**
   - [ ] Update any external links (social, email, ads) to use https://www.moodmnky.com where appropriate.
