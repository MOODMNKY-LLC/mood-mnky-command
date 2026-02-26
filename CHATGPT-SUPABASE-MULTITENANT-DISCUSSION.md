Turning a “single-project” Supabase app into **multi-tenant** is mostly three things:

1. **Pick a tenancy model** (how you represent orgs/workspaces)
2. **Add tenant scoping to your data model**
3. **Enforce tenant isolation with RLS everywhere** (and make it hard to bypass)

Below is a practical blueprint you can apply incrementally without rewriting your whole app.

---

## 1) Choose your tenancy model

### Model A — Single database, shared tables, `tenant_id` column (recommended)

* Every tenant shares the same schema/tables
* Each row is scoped with `tenant_id`
* RLS ensures isolation

**Pros:** simplest, cheapest, scales well for most SaaS
**Cons:** need discipline (every table must be tenant-scoped)

### Model B — Schema-per-tenant (rare in Supabase)

* Each tenant gets its own Postgres schema
* You dynamically route queries

**Pros:** stronger isolation, easier per-tenant data export
**Cons:** operationally heavy, migrations become painful

### Model C — Database-per-tenant (only when you *must*)

**Pros:** hard isolation
**Cons:** expensive, complex, not necessary for most apps

**Go with Model A.**

---

## 2) Create core multi-tenant tables

You need a canonical set of “org/workspace” entities.

### Tenants

* `tenants`

  * `id` (uuid)
  * `name`
  * `slug` (unique)
  * `created_by` (uuid → auth.users)
  * timestamps

### Membership + roles

* `tenant_members`

  * `tenant_id`
  * `user_id`
  * `role` (`owner | admin | member | viewer`)
  * `status` (`active | invited | suspended`)
  * timestamps

### Invitations (optional but common)

* `tenant_invites`

  * `tenant_id`
  * `email`
  * `role`
  * `token`
  * `expires_at`
  * `accepted_at`

This gives you orgs + RBAC.

---

## 3) Add tenant scoping to your existing tables

For every “business data” table, add:

* `tenant_id uuid not null references tenants(id)`

Examples in your ecosystem:

* `chat_threads.tenant_id`
* `repos.tenant_id`
* `workspaces.tenant_id`
* `documents.tenant_id`
* `tool_calls.tenant_id`

### Migration strategy (don’t break prod)

1. Create a “default tenant” for your existing data.
2. Add `tenant_id` as **nullable** first.
3. Backfill `tenant_id` for existing rows.
4. Set `tenant_id` to **NOT NULL**.
5. Add indexes (`tenant_id`, plus composite indexes you query often).

---

## 4) Enforce isolation with RLS (the real multi-tenant switch)

### The golden rule

**No app table should be readable/writable without tenant membership checks.**

#### Step-by-step

1. Enable RLS on every table containing tenant-scoped data
2. Create a helper function:

   * `is_tenant_member(tenant_id, auth.uid())`
3. Add policies for:

   * SELECT
   * INSERT
   * UPDATE
   * DELETE

### Example policy pattern (conceptually)

* SELECT allowed if user is an active member of the row’s `tenant_id`
* INSERT allowed if user is a member of the target tenant (and `tenant_id` matches)
* UPDATE/DELETE allowed if role is `admin/owner`, or if row is “owned by user” + member

**Important:** Don’t rely on the client to pass correct `tenant_id`. RLS should validate it.

---

## 5) Decide how the “current tenant” is chosen in the app

You need a stable way to set “which tenant I’m operating on right now”.

### Good UX pattern

* User can belong to multiple tenants
* App has a tenant switcher
* Every request includes an active tenant context

### Implementation options

#### Option 1 (recommended): Store `active_tenant_id` in your own `profiles` table

* `profiles.user_id`
* `profiles.active_tenant_id`

Then in your API routes you:

* read the user’s `active_tenant_id`
* validate membership
* use it for queries/inserts

#### Option 2: Put tenant in the URL

* `/t/[slug]/…`
* Resolve slug → tenant_id server-side
* Validate membership

This is clean and works great for Next.js.

#### Option 3: JWT custom claims (advanced)

You can embed a tenant/role in JWT, but:

* membership changes require token refresh
* users can belong to multiple tenants
  So it’s usually better to keep tenant context in DB + URL.

---

## 6) Update your app writes to be tenant-safe

### You want server-side inserts for sensitive tables

If you’re using Next.js + Supabase:

* do critical writes in **server routes / server actions**
* pass `tenant_id` from server-validated context
* keep direct client writes only for safe tables (or keep them but rely on strong RLS)

### Add guardrails in Postgres (optional but excellent)

Add a trigger that rejects inserts where:

* `tenant_id` is null
* `tenant_id` doesn’t match the user’s membership (RLS already covers, but triggers can help prevent footguns in admin scripts)

---

## 7) Handle shared resources cleanly (repos, integrations, secrets)

In your stack (GitHub, Notion, n8n, Coolify), you’ll have “connections” that must be tenant-scoped.

### Recommended table

* `integrations`

  * `tenant_id`
  * `provider` (`github|notion|n8n|coolify`)
  * `external_id` (installation id, workspace id, etc.)
  * `encrypted_secret_ref` (or store secret outside DB)
  * `status`

**Rule:** integrations belong to tenants, not users.

---

## 8) Multi-tenant + Realtime: do it safely

When subscribing to Realtime channels:

* subscribe per `tenant_id` and/or per `thread_id`
* ensure your database policies restrict which rows the user can see

If your UI has “runs/events”:

* store events with `tenant_id`
* filter on server or rely on RLS

---

## 9) “Super admin” and operational access

You’ll eventually need staff/admin access across tenants.

Best practice:

* keep a separate “platform admin” concept using:

  * a server-only service role
  * or a `platform_admins` table + edge functions
* do *not* weaken RLS for normal users.

---

## 10) Minimal conversion checklist (what to do first)

1. Add `tenants`, `tenant_members`, (optional invites)
2. Add `tenant_id` to your primary tables
3. Backfill with a default tenant
4. Turn on RLS + membership policies
5. Add tenant selection (URL slug or active tenant)
6. Move sensitive writes to server routes
7. Add indexes + test “tenant isolation” with two accounts

---

## Common pitfalls (avoid these)

* Forgetting `tenant_id` on “secondary” tables (logs, comments, events)
* Having a table where `user_id` is checked but `tenant_id` isn’t (data leaks)
* Using the Supabase **service role** in places reachable by the client
* Letting client pass `tenant_id` without server validation (RLS should catch it, but don’t tempt fate)

---

## If you tell me what your current schema looks like, I’ll map it directly

If you paste (or describe) the main tables you already have (even just names + key columns), I’ll:

* propose the exact `tenant_id` additions
* give you the RLS policy set per table
* and recommend whether URL-slug or active-tenant is better for your Next.js layout

No need to be perfect — a quick list of your top 10 tables is enough.
