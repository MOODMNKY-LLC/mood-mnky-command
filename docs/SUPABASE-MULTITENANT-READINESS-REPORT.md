# Supabase Multi-Tenant Readiness Evaluation Report

**Project:** mood-mnky-command  
**Date:** February 2025  
**Reference:** [CHATGPT-SUPABASE-MULTITENANT-DISCUSSION.md](../CHATGPT-SUPABASE-MULTITENANT-DISCUSSION.md)

---

## 1. Executive summary

**Can we switch to multi-tenancy safely?** Yes, provided the migration is done incrementally and in the recommended order. The codebase has no tenant model today (no `tenants`, `tenant_members`, or `tenant_id`), so the switch is additive: introduce core tenant tables, add nullable `tenant_id` to business tables, backfill a default tenant, then enforce NOT NULL and RLS. The app already uses RLS consistently and keeps service-role usage server-side only, which reduces risk.

**Verdict:** Safe to adopt Model A (single DB, shared tables, `tenant_id` + RLS) with a phased migration. Expect significant but manageable schema and API churn; the main risks are migration ordering, backfill correctness, and ensuring every tenant-scoped route validates tenant context.

**Top three risks and mitigations:**

| Risk | Mitigation |
|------|------------|
| Data leakage across tenants | Add `tenant_id` to every business table; enforce RLS with `is_tenant_member(tenant_id, auth.uid())`; never trust client-supplied `tenant_id` without server resolution and membership check. |
| Service-role bypassing tenant isolation | Audit all 50+ `createAdminClient()` call sites: pass `tenant_id` from server-validated context (slug or profile) into every tenant-scoped query; keep platform-only paths clearly separated. |
| Broken prod during migration | Follow nullable → backfill → NOT NULL order; create a default tenant first; run backfill in a transaction; add indexes after NOT NULL; test two-tenant isolation before cutover. |

---

## 2. Current state

### Schema

- **No tenant model.** The app’s public schema has no `tenants`, `tenant_members`, or `tenant_invites` tables and no `tenant_id` column on any table. All data is either:
  - **User-scoped:** `user_id` or `profile_id` (e.g. `profiles`, `saved_blends`, `product_drafts`, `media_assets`, `chat_sessions`, `chat_messages`, gamification tables, funnel runs, referral, etc.).
  - **Global / platform:** Single-tenant config (e.g. `fragrance_oils`, `formulas`, `flowise_embed_config`, `discord_guild_configs`, `deployed_services`, `config_xp_rules`, `rewards`, `main_landing_*`), or service-role-only tables (`customer_account_code_verifiers`, `customer_account_tokens`, `storefront_chat_sessions`/`storefront_chat_messages`).
- The `organization_id` in `apps/web/lib/supabase/management.ts` refers to the **Supabase Cloud organization**, not app-level tenancy.
- The n8n `workspace` / `organization` in `supabase/migrations/20260207031136_remote_schema.sql` is **external** (n8n’s schema), not the app’s tenant model.

### RLS

- RLS is **enabled** on app-owned public tables (see `supabase/migrations/20250206000000_initial_schema.sql` and later migrations).
- Policies are **single-tenant:** either `auth.uid() = user_id` or `auth.uid() = profile_id` (own-row), or `public.is_admin()` (global admin), or anon read / service_role write. There is **no** `is_tenant_member(tenant_id, auth.uid())` or tenant-scoped policy.
- Admin is implemented via `public.is_admin()` (SECURITY DEFINER) reading `profiles.role = 'admin'` (see `supabase/migrations/20260213200000_fix_profiles_rls_recursion.sql`).

### Service role

- `apps/web/lib/supabase/admin.ts` exposes `createAdminClient()` (service_role key), which bypasses RLS. It is used in **50+** API routes and libs; all usage is **server-side** (no client exposure). For multi-tenant, each call site must be reviewed so admin operations are either tenant-scoped (with server-validated `tenant_id`) or explicitly platform-only.

### Blueprint alignment

- The discussion doc recommends **Model A** (single database, shared tables, `tenant_id` column, RLS). The project is a good fit for Model A but currently has **none** of the required pieces: no `tenants`/`tenant_members`, no `tenant_id` on tables, no tenant-based RLS.

---

## 3. Readiness

### Missing pieces

- **Core tables:** `tenants`, `tenant_members`, and (optional) `tenant_invites` as in the discussion doc §2.
- **Scoping:** `tenant_id uuid not null references tenants(id)` on every business table that should be tenant-isolated.
- **RLS:** Helper `is_tenant_member(tenant_id, auth.uid())` and policies that use it for SELECT/INSERT/UPDATE/DELETE on tenant-scoped tables.
- **App context:** A stable “current tenant” (e.g. URL slug `/t/[slug]` and/or `profiles.active_tenant_id`) and server-side resolution/validation.

### Table matrix

Classification is migration-based (no live DB snapshot). Tables from `remote_schema` (n8n) and auth schema are excluded.

| Table | Current scoping | Proposed | RLS change |
|-------|-----------------|----------|------------|
| **Core (new)** | — | — | — |
| tenants | — | New table | RLS: members see own tenant(s). |
| tenant_members | — | New table | RLS: users see own rows; tenant owner/admin manage. |
| tenant_invites | — | Optional new | RLS: invitee/tenant admin. |
| **User / profile** | | | |
| profiles | user (auth.uid = id) | Add `active_tenant_id` (nullable → FK tenants) | Keep own-row; add policy to read tenant_members for active_tenant_id. |
| **User-scoped business data** | | | |
| saved_blends | user_id | tenant_id + user_id | Add is_tenant_member(tenant_id) and match tenant. |
| product_drafts | user_id | tenant_id + user_id | Same. |
| media_assets | user_id | tenant_id + user_id | Same. |
| chat_sessions | user_id | tenant_id + user_id | Same. |
| chat_messages | session_id (→ user) | tenant_id (or via session) | Same. |
| flowise_chatflow_assignments | profile_id | tenant_id + profile_id | Same. |
| flowise_user_document_stores | profile_id | tenant_id | Same. |
| flowise_chat_logs | user_id | tenant_id | Same. |
| flowise_chat_feedback | user_id | tenant_id | Same. |
| code_mnky_config | user-scoped | tenant_id | Same. |
| agent_profiles | — | tenant_id | Same. |
| voice_consents | user_id | tenant_id | Same. |
| custom_voices | user_id | tenant_id | Same. |
| audio_transcripts | user_id | tenant_id | Same. |
| mnky_mind_entries | user_id | tenant_id | Same. |
| **Funnels** | | | |
| funnel_definitions | is_admin / active | tenant_id | Tenant admin + is_tenant_member. |
| funnel_runs | user_id | tenant_id + user_id | Same. |
| funnel_answers | run_id | tenant_id (or via run) | Same. |
| funnel_events | run_id | tenant_id | Same. |
| **Gamification / XP** | | | |
| xp_ledger | profile_id | tenant_id + profile_id | Same. |
| xp_state | profile_id | tenant_id + profile_id | Same. |
| discord_event_ledger | profile_id | tenant_id | Same. |
| mnky_seasons | global admin | tenant_id | Tenant admin. |
| rewards | global read, admin write | tenant_id | Tenant-scoped read/write. |
| reward_claims | profile_id | tenant_id + profile_id | Same. |
| quests | global / anon active | tenant_id | Tenant-scoped. |
| quest_progress | profile_id | tenant_id + profile_id | Same. |
| ugc_submissions | profile_id | tenant_id | Same. |
| config_xp_rules | admin | tenant_id | Tenant admin. |
| **Referral** | | | |
| referral_codes | profile_id | tenant_id | Same. |
| referral_events | profile_id / code | tenant_id | Same. |
| **Manga / Verse content** | | | |
| mnky_collections | authenticated / admin | tenant_id | Same. |
| mnky_issues | idem | tenant_id | Same. |
| mnky_chapters | idem | tenant_id | Same. |
| mnky_panels | idem | tenant_id | Same. |
| mnky_hotspots | idem | tenant_id | Same. |
| mnky_read_events | profile_id | tenant_id | Same. |
| mnky_download_events | profile_id | tenant_id | Same. |
| mnky_quiz_attempts | profile_id | tenant_id | Same. |
| verse_music_playlist | anon read, admin write | tenant_id | Same. |
| verse_blog_posts | anon read published | tenant_id | Same. |
| **Discord** | | | |
| discord_guild_configs | is_admin | tenant_id | Tenant admin. |
| discord_webhooks | is_admin | tenant_id | Same. |
| discord_webhook_templates | is_admin | tenant_id | Same. |
| discord_action_logs | is_admin | tenant_id | Same. |
| **Main site** | | | |
| main_landing_faq | anon/authenticated read | tenant_id | Same. |
| main_landing_features | idem | tenant_id | Same. |
| main_landing_social_proof | idem | tenant_id | Same. |
| main_waitlist | service_role insert | tenant_id | Resolve tenant server-side. |
| main_contact_submissions | idem | tenant_id | Same. |
| main_elevenlabs_config | anon read | tenant_id | Same. |
| main_media_gallery | anon/authenticated read, service_role write | tenant_id | Same. |
| **LABZ / config** | | | |
| deployed_services | service_role | tenant_id | Same. |
| dashboard_config | service_role | tenant_id | Same. |
| flowise_embed_config | anon read, admin write | tenant_id | Same. |
| flowise_tts_config | — | tenant_id | Same. |
| flowise_chatflow_tts | — | tenant_id | Same. |
| eleven_labs_config | service_role read (sensitive) | tenant_id | Same. |
| app_asset_slots | anon/authenticated read, service_role write | tenant_id | Same. |
| jellyfin_theme_builds | — | tenant_id or global | Per-tenant or platform. |
| jellyfin_theme_latest | — | tenant_id or global | Same. |
| assistant_knowledge | public read | tenant_id or global | Optional tenant. |
| **Catalog (optional tenant)** | | | |
| fragrance_oils | authenticated read, sync write | tenant_id or global | Can stay global shared or become per-tenant. |
| formulas | authenticated read | tenant_id or global | Same. |
| formula_phases | — | tenant_id or global | Same. |
| formula_ingredients | — | tenant_id or global | Same. |
| formula_categories | — | tenant_id or global | Same. |
| fragrance_notes | authenticated | tenant_id or global | Same. |
| **Global / platform** | | | |
| sync_logs | authenticated read | Global (no tenant_id) | No change or optional tenant_id for “who synced”. |
| infra_artifact_versions | anon read, service_role write | Platform (no tenant_id) | No change. |
| customer_account_code_verifiers | service_role only | Platform | No change. |
| customer_account_tokens | service_role only | Platform | No change. |
| storefront_chat_sessions | service_role only | tenant_id if storefront per-tenant | Else keep global. |
| storefront_chat_messages | service_role only | tenant_id if per-tenant | Same. |

---

## 4. Safety and migration path

### Risks

- **Data leakage:** Any table that has `user_id`/`profile_id` but no `tenant_id` can, after multi-tenant backfill, still be queried with RLS that only checks user. Until RLS is updated to require `is_tenant_member(tenant_id, auth.uid())`, enforce tenant in app and service-role queries.
- **Service-role misuse:** `createAdminClient()` bypasses RLS. If a route uses it without filtering by tenant (or without resolving tenant from slug/profile), it can read/write across tenants. Mitigation: every tenant-scoped route must resolve and pass `tenant_id` and use it in all queries.
- **Migration ordering:** Adding NOT NULL `tenant_id` before backfilling will fail. Mitigation: add column as nullable → backfill default tenant → set NOT NULL → add indexes.
- **Rollback:** If multi-tenant is reverted, migrations must be reversed and app code must not depend on `tenant_id`. Keeping backfill reversible (e.g. default tenant id documented) helps.

### Recommended migration steps

1. Create `tenants` and `tenant_members` (and optionally `tenant_invites`) per discussion doc §2.
2. Insert a **default tenant** (e.g. “Default” / “MOOD MNKY”) and add all existing users as members (e.g. owner or admin).
3. For each business table, add `tenant_id uuid references tenants(id)` as **nullable**.
4. Backfill: `UPDATE <table> SET tenant_id = '<default_tenant_id>' WHERE tenant_id IS NULL`.
5. Alter column to NOT NULL.
6. Add indexes: `(tenant_id)` and composite indexes used in queries (e.g. `(tenant_id, profile_id)`, `(tenant_id, created_at)`).
7. Create helper `is_tenant_member(tenant_id, auth.uid())` (and optionally `is_tenant_admin`).
8. Add or replace RLS policies to use `is_tenant_member` / `is_tenant_admin` on tenant-scoped tables.
9. Add `active_tenant_id` to `profiles` (nullable FK to tenants); backfill with default tenant for existing users.
10. Test isolation: create a second tenant and second user, verify first user cannot see second tenant’s data via anon or authenticated client.

### Rollback

- Revert migrations in reverse order: drop new RLS policies, drop `tenant_id` columns (or leave nullable and stop using), drop `tenant_members`/`tenants`, remove `active_tenant_id` from profiles. App must not send `tenant_id` or rely on tenant tables once reverted.

### Testing

- After backfill, run a two-tenant test: two tenants, two users (each member of one tenant). Use authenticated Supabase client per user and confirm neither can read the other’s tenant-scoped rows. Optionally use service-role with explicit `tenant_id` filters to confirm correct isolation.

---

## 5. Pros and cons

### Pros

- **SaaS readiness:** Same codebase can serve multiple organizations (brands, teams, workspaces) with clear data isolation.
- **Isolation:** RLS + `tenant_id` gives a single, auditable boundary; no cross-tenant reads/writes if policies and app code are correct.
- **Per-tenant RBAC:** `tenant_members.role` (owner/admin/member/viewer) allows different permissions per org without overloading global `profiles.role`.
- **Scalability:** Model A keeps one DB and one schema; scaling is mostly indexing and connection/query tuning, not managing many DBs.

### Cons

- **Schema and API churn:** Many tables and 50+ API routes need `tenant_id` and tenant resolution; every tenant-scoped write must set and validate tenant.
- **Service-role audit:** Every `createAdminClient()` use must be reviewed and updated to pass tenant where applicable; easy to miss a route and leak data.
- **Testing burden:** All flows that touch tenant-scoped data should be tested with multiple tenants and roles.
- **Realtime and storage:** If Supabase Realtime or storage is used per-tenant later, channels and bucket paths must be tenant-scoped (see §6). Currently the app does not use Supabase Postgres Realtime; storage uses user-based folder paths that could be extended to tenant (e.g. `tenant_id/user_id/...`).

---

## 6. Implementation impact (code-mnky)

### 1. Where tenant context should be set

**Recommendation: URL slug for dashboard/LABZ, plus `profiles.active_tenant_id` for session.**

- **URL slug (`/t/[slug]/...`)**  
  Use for the **dashboard and LABZ** areas (today under `(dashboard)/`). The slug is the source of truth for “which tenant this request is for”: shareable, bookmarkable, and no stale context. All dashboard/LABZ routes should live under something like `/t/[slug]/...` (e.g. `/t/acme/dashboard`, `/t/acme/labz/...`). Server-side: resolve `slug` → `tenant_id` via `tenants.slug`, then enforce membership before rendering or calling APIs.

- **`profiles.active_tenant_id`**  
  Use as the “current workspace” for the logged-in user. Set it when they enter a tenant (e.g. by opening `/t/[slug]/...` or choosing a tenant in a switcher) and when they switch tenant. Use it in API routes that don’t have a slug in the path (e.g. `POST /api/labz/...` called from the client without the slug in the URL). Server must always validate that the user is an active member of `active_tenant_id` before using it; never trust it blindly.

- **Fit with this Next.js app**  
  The app already has route groups `(dashboard)`, `(storefront)/verse`, `(main)`, and `dojo`. Introducing a single tenant segment `t/[slug]` for dashboard/LABZ keeps tenant context explicit and avoids changing every existing path at once. Verse storefront and main site can stay on `/verse` and `/main` and get tenant from host, subdomain, or a tenant param resolved server-side (or, if they remain single-tenant for now, from a single default tenant). Auth and “me” flows stay user-scoped; they only need tenant for “which workspace to land in” (e.g. default or last `active_tenant_id`).

**Summary:** Prefer **slug in URL** for dashboard/LABZ; use **`profiles.active_tenant_id`** for session-based APIs that don’t receive the slug. Resolve slug → `tenant_id` on the server and validate membership in both cases.

### 2. API routes and server components that need tenant context

| Category | Routes / areas | Tenant source | Notes |
|----------|----------------|---------------|--------|
| **Dashboard / LABZ** | `/api/labz/*` (dashboard-config, settings, deployed-services, n8n, document-store, verse-music, mnky-mind, agents, etc.), `/api/dashboard/stats`, `/api/verse-backoffice/*` | Slug from path `/t/[slug]/...` or validated `active_tenant_id` from profile | All touch tenant-scoped tables; stats and config must be filtered by tenant. |
| **Verse storefront** | `/api/verse/*` (music, blog, chat, etc.) | Tenant from host/subdomain or slug/param; or single default tenant | If verse_* and storefront chat are per-tenant, every call needs resolved tenant. |
| **Main site** | `/api/main/*` (waitlist, contact, media/gallery, elevenlabs-config, search, audio-library, etc.) | Tenant from slug or subdomain (if main is per-tenant) | main_* tables are tenant-scoped; APIs must pass tenant into queries. |
| **Auth / me** | `/api/me/*`, `/api/auth/*`, `/api/customer-account-api/*` | User-only; tenant only for default/active workspace | Use tenant for post-login redirect or tenant switcher. |
| **Discord** | `/api/discord/*` | Slug or validated `active_tenant_id` | discord_* tables are tenant-scoped. |
| **Flowise** | `/api/flowise/*` | Slug or validated `active_tenant_id` | flowise_* tables are tenant-scoped. |
| **XP / gamification** | `/api/xp/*`, `/api/rewards/*`, `/api/gamification/*`, `/api/ugc/*`, `/api/referral/*` | Slug or validated `active_tenant_id` | xp_*, rewards, quests, ugc, referral_* are tenant-scoped. |
| **Funnels** | `/api/funnels/*` | Slug or validated `active_tenant_id` | funnel_* tables are tenant-scoped. |
| **Sync / scripts** | `/api/notion/sync/*`, `/api/shopify/sync/*`, Inngest, scripts | Tenant from job payload or config; never from client | Each sync run must be for a specific tenant. |
| **Platform-only** | `/api/customer-account-api/*`, `/api/admin/*` (platform-wide), `/api/platform/*` | No tenant; service_role or platform admin | customer_account_*, platform storage stay platform-only. |

**Server components:** Any dashboard/LABZ page that reads tenant-scoped data should receive tenant from the segment (e.g. `t/[slug]`) and pass it into data fetches. Verse and main pages that become tenant-aware should get tenant from layout/params/host.

### 3. Middleware and helpers

- **`getTenantFromSlug(slug: string)`** — Look up `tenants` by `slug`; return `{ id, slug, name }` or null. Use in middleware or route handlers for `/t/[slug]/...`.
- **`requireTenantMember(tenantId: string, userId: string)`** — Check `tenant_members` for active membership; return membership (and optionally role).
- **`requireTenantAdmin(tenantId: string, userId: string)`** — Same but require role admin or owner for writes.
- **`setActiveTenantInProfile(userId: string, tenantId: string)`** — After validating membership, update `profiles.active_tenant_id`.
- **Middleware** — For `/t/[slug]/...`: parse slug, resolve tenant, attach to request; validate auth and membership; redirect or 404 if invalid.

### 4. Checklist of code changes

- **(a)** All routes touching tenant-scoped tables must receive and validate tenant (from slug or validated `active_tenant_id`); pass `tenant_id` into every tenant-scoped query; never trust client-supplied `tenant_id` without server resolution.
- **(b)** For tenant-scoped tables, replace global `is_admin()` in RLS with `is_tenant_member` / `is_tenant_admin`; keep `is_admin()` only for platform/global tables.
- **(c)** Never accept `tenant_id` from client without resolving from slug or from server-fetched profile and validating membership.

---

## 7. Realtime, storage, and edge cases

- **Supabase Realtime:** The app does **not** use Supabase Postgres Realtime (no `.channel()` or `postgres_changes` in app code). “Realtime” in the repo refers to the OpenAI Realtime API (voice). If Supabase Realtime is added later for tenant-scoped data, subscribe per `tenant_id` (and/or resource id) and ensure RLS restricts rows by tenant.
- **Storage:** Buckets use folder paths keyed by `auth.uid()` (e.g. `user_id/...`). For multi-tenant, consider paths like `tenant_id/user_id/...` and RLS or policy that restricts access by tenant membership. All existing storage policies are in migrations (e.g. `20250206000000_initial_schema.sql`, `20260211120000_ai_videos_bucket.sql`); new policies must enforce tenant when objects become tenant-scoped.
- **Integrations:** The discussion doc suggests an `integrations` table (tenant_id, provider, external_id, etc.) for GitHub, Notion, n8n, etc. The app has n8n config and Notion sync; if these become per-tenant, introduce a tenant-scoped integrations (or similar) table and scope all connection lookups by tenant.
- **Pitfalls:** Forgetting `tenant_id` on secondary tables (e.g. logs, comments, events); having a table where only `user_id` is checked and not `tenant_id` (leak); using service role in client-reachable code (none today); letting the client set `tenant_id` without server validation (must always resolve and validate).

---

## 8. Minimal conversion checklist

1. Add `tenants`, `tenant_members`, (optional) `tenant_invites` per discussion doc §2.
2. Add nullable `tenant_id` to all tenant-scoped tables; create default tenant; backfill; set NOT NULL; add indexes.
3. Add `is_tenant_member(tenant_id, auth.uid())` (and optionally `is_tenant_admin`); enable RLS on new tables; add tenant-based policies to existing tables.
4. Add tenant selection in the app: URL slug `/t/[slug]/...` for dashboard/LABZ and/or `profiles.active_tenant_id` with switcher; resolve and validate tenant on every tenant-scoped request.
5. Move sensitive writes to server routes (or keep and rely on RLS); pass `tenant_id` from server-validated context only.
6. Audit all `createAdminClient()` usages: tag platform-only vs tenant-scoped; for tenant-scoped, pass and filter by `tenant_id`.
7. Add composite indexes `(tenant_id, ...)` for hot queries; test two-tenant isolation before cutover.
8. (Optional) Add `integrations` (or equivalent) for per-tenant Notion/n8n/Shopify connections.
9. (Optional) Extend storage policies to tenant-scoped paths if assets are per-tenant.
10. Document rollback steps and default tenant id for operations.

---

## 9. Common pitfalls (mapped to this codebase)

| Pitfall (discussion doc) | Status in this project |
|---------------------------|-------------------------|
| Forgetting `tenant_id` on secondary tables (logs, comments, events) | Not applicable until tenant_id exists; when adding, ensure funnel_events, discord_action_logs, xp_ledger, etc. get tenant_id. |
| Table where `user_id` is checked but `tenant_id` isn’t (data leaks) | Currently every user-scoped table has no tenant_id; after adding, every policy must also check tenant (e.g. is_tenant_member). |
| Using Supabase **service role** in client-reachable code | **None.** All createAdminClient() use is server-side (API routes, server components, Inngest, scripts). |
| Letting client pass `tenant_id` without server validation | Must avoid: resolve tenant only from URL slug or from server-fetched profile + requireTenantMember; RLS will enforce but server validation reduces misuse. |

---

*End of report. Evaluation is migration-based; for production, run a one-time live schema dump (e.g. via Supabase Management API or `listTables`) to confirm no drift from migrations.*
