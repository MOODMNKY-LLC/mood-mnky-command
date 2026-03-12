# Stack deployment debug summary

Summary of Coolify logs fetched and issues identified (March 2025).

## Coolify applications (from `node portal/scripts/coolify-logs.mjs --list`)

| Name                    | UUID                     | Notes                    |
|-------------------------|--------------------------|---------------------------|
| MNKY BLOG               | uwkg4kwosg00kwswwgkwg0c0 | Next.js; missing Supabase env |
| professional-boundaries | no4wc8sgoc8skw0ok00w8c4s | Next.js 15; multipart / Server Action errors |
| test                    | bk0gso4kg8scs44g8oo48csg | Coolify: "Application is not running" (400 on logs) |

## Issues identified

### 1. MNKY BLOG
- **Logs:** Repeated `Your project's URL and Key are required to create a Supabase client!`
- **Cause:** Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY` or similar) are not set in the Coolify application’s environment.
- **Fix:** In Coolify → project → MNKY BLOG → Environment / build env, add the Supabase project URL and anon key (and any other required vars from the app’s `.env.example` or docs).

### 2. professional-boundaries (Next.js 15)
- **Logs:** Many `[TypeError: Error: Unexpected end of multipart data]` and `Failed to find Server Action "x". This request might be from an older or newer deployment.`
- **Cause:**  
  - **Multipart:** Often from form submissions or file uploads when the request body is truncated or the client sends invalid multipart.  
  - **Server Action "x":** Stale client (browser) is calling a server action that no longer exists after a new deployment (build ID mismatch).
- **Fixes:**  
  - Hard refresh or clear site data for that app’s URL so the client gets the new build.  
  - If multipart persists: check forms/uploads (size limits, proxy timeouts, correct `Content-Type`).  
  - Ensure Coolify redeploys produce a single consistent build (no mixed old/new containers).

### 3. test
- **Coolify API:** `GET /applications/{uuid}/logs` returns **400 – Application is not running.**
- **Meaning:** The app (or compose stack) is stopped or never started, so Coolify has no logs to return.
- **Fix:** In Coolify UI, start the application (or the compose stack). If it exits immediately, check service-specific logs in Coolify (per service in the stack) and fix startup errors (env, health checks, dependencies).

## Docker Compose stack (MinIO, Flowise, n8n, Postgres, etc.)

From your screenshot, the stack with “Service Specific Configuration” (MinIO, Postgres `mood_mnky`) is one Coolify **project** that contains multiple **services**. Coolify’s **application logs** endpoint returns the **aggregate logs** for that application (one app = one compose stack). So:

- If that stack is **test** and it’s stopped → start it in Coolify; then logs will be available via API/script.
- If that stack is **professional-boundaries**, the logs we pulled are from the main process (Next.js); Compose services (MinIO, Postgres, etc.) may have their own logs in Coolify under each service.

To fetch logs for a specific app from the command line:

```bash
# From supabase-mt
node portal/scripts/coolify-logs.mjs <application-uuid> 500 --out my-logs.txt
```

## Portal: View logs in UI

- **App Factory → Projects:** Each row with a Coolify deployment has a **Logs** button. It fetches the last 500 lines of that project’s Coolify application logs (same as above). If the app is not running, you’ll see Coolify’s error (e.g. “Application is not running”).
