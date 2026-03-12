# Full-stack Runbook (Supabase self-hosted + Flowise + n8n)

Step-by-step setup, env, volumes, and Coolify caveats for the **full-stack** compose (`temp/full-stack/docker-compose.full-stack.yml`). Use this when deploying or operating the full-stack; for the lighter agent-stack only, see [DEPLOYMENT-PLAN-COOLIFY.md](./DEPLOYMENT-PLAN-COOLIFY.md) and `docker-compose/`.

---

## 1. What the full-stack includes

- **Supabase self-hosted:** db, kong, auth, rest, realtime, storage, studio, analytics, pooler, vector.
- **Flowise:** queue mode with Redis + dedicated worker.
- **n8n:** main instance + external task runners (runner image version should match n8n).
- **MinIO:** S3 for Supabase Storage and optional Flowise/n8n artifacts.

Persistence: shared `stack_data` volume; separate `db-config` for Supabase Postgres custom config.

---

## 2. Prerequisite: Supabase `./volumes/` tree

The compose file mounts paths under `./volumes/` (relative to the compose file directory). Without these, Supabase services will not start.

### What you need

- `./volumes/api/kong.yml` — Kong API gateway config.
- `./volumes/db/*.sql` — Postgres init / migrations.
- `./volumes/logs/vector.yml` — Vector log config.
- `./volumes/pooler/pooler.exs` — PgBouncer pooler config.
- `./volumes/snippets`, `./volumes/functions` — Studio snippets/functions (optional but recommended).

### How to obtain

1. Clone or download the [Supabase self-hosted reference](https://github.com/supabase/supabase/tree/master/docker).
2. Copy the **`volumes`** directory from that repo into the same directory as `docker-compose.full-stack.yml` (or the directory from which you run `docker compose -f ...`), so that paths resolve as `./volumes/...`.

Example layout:

```
temp/full-stack/
  docker-compose.full-stack.yml
  env.full-stack
  .env                    # copy from env.full-stack, then edit
  volumes/                # from Supabase self-hosted repo
    api/
      kong.yml
    db/
      ...
    logs/
      vector.yml
    pooler/
      pooler.exs
    snippets/
    functions/
```

---

## 3. Environment variables

- **Reference file:** `temp/full-stack/env.full-stack`. Copy it to `.env` in the same directory as the compose file.
- **Required:** Set strong values for `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, and Flowise/n8n/MinIO secrets. The reference file contains example/placeholder values — **do not use them in production**.
- **Production:** Override with secure secrets, set public URLs (`SUPABASE_PUBLIC_URL`, `API_EXTERNAL_URL`, `SITE_URL`, `APP_URL`), configure SMTP (e.g. `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`), and enable secure cookies / domain settings as per Supabase and your reverse proxy.
- **AGENT-TODO.md** in the repo root has a short [Full-stack (temp/full-stack)](../../AGENT-TODO.md#full-stack-tempfull-stack) env matrix; keep it in sync when adding or changing variables.

---

## 4. Run locally

```bash
cd temp/full-stack   # or the path where compose + .env + volumes/ live
docker compose -f docker-compose.full-stack.yml up -d
```

Verify: Kong (8000), Studio (3000), Flowise, n8n, and MinIO on their configured ports.

---

## 5. Deploy via Coolify (App Factory)

- The App Factory can deploy the full-stack by sending the compose content from `compose_stacks` (synced via **Sync compose (full-stack)** in Admin) to Coolify as a Docker Compose application.
- **Critical:** Coolify runs `docker compose up` on the **server**. The server (or the build context Coolify uses) must have the same **`./volumes/`** tree at the path expected by the compose file. Otherwise Supabase services will fail to start.
- **Options:**
  1. **Build context / repo:** Include the `volumes/` directory in the repo or in the Coolify build context so it is present on the server next to the compose file (or at the base directory Coolify uses).
  2. **Bring your own:** Manually place the Supabase `volumes/` tree on the Coolify server at the required path before or after creating the Compose resource; document the path in your runbook.
- Set all required env (Supabase, Flowise, n8n, MinIO) in the Coolify application env; do not rely on a committed `.env` for production secrets.

---

## 6. When to use full-stack vs agent-stack

| Use case | Stack |
|----------|--------|
| Flowise + n8n + Postgres/Redis/MinIO only (no Supabase self-hosted) | **agent-stack** (`docker-compose/`) |
| Full backend: Supabase (auth, DB, storage) + Flowise + n8n in one compose | **full-stack** (`temp/full-stack/`) |

---

## 7. Deep-thinking protocol (optional)

For deep research on integration strategy, production patterns (Flowise queue, n8n runners, Supabase S3/MinIO), or volumes and deployability, follow [.cursor/rules/deep-thinking.mdc](../../.cursor/rules/deep-thinking.mdc): initial clarifying questions → research plan (themes) → Brave/Sequential Thinking/Tavily cycles → final report. Use the results to update this runbook and the deployment plan (practical implications, risks, recommendations). The protocol is **not** required for routine setup or deploy; it is for strategy and when you need a documented analysis.

---

## 8. References

- [temp/full-stack/README.md](../../temp/full-stack/README.md) — Quick overview and prerequisite.
- [DEPLOYMENT-PLAN-COOLIFY.md](./DEPLOYMENT-PLAN-COOLIFY.md) — Agent stack vs full-stack, Coolify, and .cursor assignments.
- [AGENT-TODO.md](../../AGENT-TODO.md) — Env matrix and Full-stack section.
- [Supabase self-hosted Docker](https://github.com/supabase/supabase/tree/master/docker) — Source for `volumes/`.
