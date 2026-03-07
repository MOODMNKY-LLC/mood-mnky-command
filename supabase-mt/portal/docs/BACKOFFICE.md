# Portal Backoffice & Supabase Platform Kit

## Where the platform kit lives

The **Supabase platform kit** (database, storage, auth, users, secrets, logs, suggestions) is implemented in the portal as:

- **Entry component**: `components/index.tsx` — default export **`SupabaseManagerDialog`**
- **Managers** (used inside the dialog):
  - `components/database.tsx` — `DatabaseManager` (tables, SQL editor)
  - `components/storage.tsx` — `StorageManager` (buckets, objects)
  - `components/auth.tsx` — `AuthManager` (auth config)
  - `components/users.tsx` — `UsersManager` (user counts, growth)
  - `components/secrets.tsx` — `SecretsManager` (env secrets)
  - `components/logs.tsx` — `LogsManager` (API logs)
  - `components/suggestions.tsx` — `SuggestionsManager` (AI suggestions)

All of these call the **Supabase Management API** via the in-app proxy at `/api/supabase-proxy`, which forwards to `api.supabase.com` using `SUPABASE_MANAGEMENT_API_TOKEN`.

## How to access it

1. **From the app**
   - Go to **Admin** (header link when signed in) → **Supabase backoffice** → click **Open backoffice**.
   - Or go to **Dashboard** and use the **Backoffice** entry there.

2. **Requirements**
   - Signed-in user.
   - `NEXT_PUBLIC_SUPABASE_MT_PROJECT_REF` set to your Supabase project ref (from Dashboard URL: `https://supabase.com/dashboard/project/<ref>`).
   - `SUPABASE_MANAGEMENT_API_TOKEN` set (Supabase Dashboard → Account → Access Tokens).

Without `NEXT_PUBLIC_SUPABASE_MT_PROJECT_REF`, the backoffice button is hidden or disabled and the admin page explains what to set.

## Admin dashboard

The **Admin** page (`/admin`) is the main backoffice/config surface:

- **Supabase backoffice** — Opens the platform kit dialog (Database, Storage, Auth, Users, Secrets, Logs, Suggestions).
- **App instances** — List, add, edit, and remove Flowise and n8n instances per tenant. Configure links open the Flowise or n8n configuration panels (chatflows, assistants, variables, tools; workflows, executions, credentials). See [BACKOFFICE-FLOWISE-N8N.md](./BACKOFFICE-FLOWISE-N8N.md).
- **Quick links** — Dashboard, organizations (tenant list), profile.

**Access control:** Only users with **platform_role = platform_admin** can open `/admin` and see the Admin link. The **first authenticated user** (earliest by signup) is automatically assigned `platform_admin`; everyone else gets `user`. Tenant membership does **not** grant backoffice access—tenants cannot see or use the Supabase backoffice unless they are also platform admins.

---

## Platform vs tenant roles

Roles are split into two layers so tenant admins never get platform backoffice access by default.

### Platform roles (`profiles.platform_role`)

| Role | Purpose |
|------|--------|
| **platform_admin** | Full access to `/admin` and Supabase backoffice (Database, Auth, Storage, Users, Secrets, Logs). First user is assigned this; others only via DB update. |
| **platform_moderator** | Reserved for future limited admin features (e.g. user management without secrets). |
| **user** | Normal authenticated user. No Admin link, no backoffice. |
| **pending** | Reserved for invited / not-yet-approved users. |

Helpers: `is_platform_admin(user_id)`, `is_platform_moderator_or_admin(user_id)` (in DB).

### Tenant roles (`tenant_members.role`)

| Role | Purpose |
|------|--------|
| **owner** | Tenant creator; full control within the tenant. |
| **admin** | Can manage tenant settings, invites, app instances (with `is_tenant_admin` in RLS). |
| **moderator** | Between admin and member; for future content/moderation scope. |
| **member** | Standard tenant member. |
| **viewer** | Read-only within the tenant. |

Tenant roles apply only **inside** a tenant (org). They do **not** grant access to `/admin` or the Supabase backoffice. Only `platform_admin` does.

### First user and promoting admins

- The **first user** to sign up (oldest `profiles.created_at`) is automatically given `platform_admin` by the `handle_new_user` trigger. If no profile has `platform_admin` yet, the new profile is assigned it; otherwise the new profile gets `user`.
- To **promote another user** to platform admin, set their `platform_role` in the database, e.g. in Supabase SQL:  
  `update public.profiles set platform_role = 'platform_admin' where id = '<user_uuid>';`
- Only platform admins can open `/admin` and use the backoffice; tenant owners/admins do not get this access unless they are also platform admins.
