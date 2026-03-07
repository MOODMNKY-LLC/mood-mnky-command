# Deploy on homelab (two VMs, Cloudflare Tunnels)

This doc gives exact commands for a **split** homelab deployment: VM1 runs self-hosted Supabase from `temp/supabase/docker`; VM2 runs this compose (Flowise, n8n, Postgres, Redis, MinIO). Services are exposed via Cloudflare Tunnels (no open router ports).

## Prerequisites

- Two VMs or LXC containers (see [README](../README.md) VM/LXC specs: 4 GB RAM, 2 vCPU, 40–50 GB disk each).
- Docker and Docker Compose on both.
- A domain and Cloudflare with tunnel(s) configured; each service gets a hostname (e.g. `supabase.yourdomain.com`, `flowise.yourdomain.com`, `n8n.yourdomain.com`).

## VM1: Self-hosted Supabase

1. Copy the repo (or at least `temp/supabase/docker`) to the VM.

2. Configure Supabase:
   ```bash
   cd temp/supabase/docker
   cp .env.example .env
   # Generate secrets and JWT keys
   sh ./utils/generate-keys.sh
   ```
   Edit `.env`: set `SUPABASE_PUBLIC_URL` and `API_EXTERNAL_URL` to your Supabase tunnel URL (e.g. `https://supabase.yourdomain.com`). Set other required vars (Postgres password, JWT secret, etc.) per [Supabase self-hosting docs](https://supabase.com/docs/guides/self-hosting/docker).

3. Start Supabase (with MinIO for Storage):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.s3.yml up -d
   ```

4. Run Cloudflare Tunnel (or equivalent) so `supabase.yourdomain.com` → `http://localhost:8000` (Kong). Use HTTPS in Cloudflare; no need to open port 8000 on the firewall.

5. From Supabase `.env`, note `ANON_KEY` and `SERVICE_ROLE_KEY` for the Portal and this stack.

## VM2: This compose (Flowise, n8n, Postgres, Redis, MinIO)

1. Copy the repo (or at least the `docker-compose` directory) to the VM.

2. Configure this stack:
   ```bash
   cd docker-compose
   cp .env.example .env
   ```
   Edit `.env`:
   - `SUPABASE_MODE=self_hosted`
   - `NEXT_PUBLIC_SUPABASE_MT_URL=https://supabase.yourdomain.com` (same as VM1 tunnel URL)
   - `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY=<ANON_KEY from Supabase .env>`
   - `SUPABASE_MT_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY from Supabase .env>`
   - Set strong passwords for Postgres, Flowise, n8n, MinIO as needed.

3. Start the stack:
   ```bash
   docker compose up -d
   ```

4. Run Cloudflare Tunnels so:
   - `flowise.yourdomain.com` → `http://localhost:3000`
   - `n8n.yourdomain.com` → `http://localhost:5678`
   Optionally `minio.yourdomain.com` → `http://localhost:9001` (MinIO console).

## Portal

On your dev machine or a third host, run the Portal with the same `.env` (or Vercel env):

- `SUPABASE_MODE=self_hosted`
- `NEXT_PUBLIC_SUPABASE_MT_URL=https://supabase.yourdomain.com`
- `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY` and `SUPABASE_MT_SERVICE_ROLE_KEY` from Supabase.

In Supabase (Studio or SQL), seed `tenant_app_instances` so `base_url` for Flowise and n8n are the tunnel URLs:

- Flowise: `https://flowise.yourdomain.com`
- n8n: `https://n8n.yourdomain.com`

## Single VM (minimal)

On one VM you can run both Supabase and this compose:

```bash
# From repo root or supabase-mt
cd temp/supabase/docker
cp .env.example .env && sh ./utils/generate-keys.sh
# Edit .env: SUPABASE_PUBLIC_URL, API_EXTERNAL_URL
docker compose -f docker-compose.yml -f docker-compose.s3.yml up -d

cd path/to/docker-compose
cp .env.example .env
# Edit .env: SUPABASE_MODE=self_hosted, NEXT_PUBLIC_SUPABASE_MT_URL, anon/service keys
docker compose up -d
```

Or use [../scripts/standalone-up.sh](../scripts/standalone-up.sh) from the `docker-compose` directory (script starts Supabase from temp then this compose).

## Cloudflare Tunnel config (example)

One tunnel per host; multiple hostnames can go to different ports on the same host. Example `config.yml` for VM2 (Flowise + n8n):

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: flowise.yourdomain.com
    service: http://localhost:3000
  - hostname: n8n.yourdomain.com
    service: http://localhost:5678
  - hostname: minio.yourdomain.com
    service: http://localhost:9001
  - service: http_status:404
```

Then run `cloudflared tunnel run <TUNNEL_NAME>`.

## Summary

| Where   | What runs                                      | Tunnel hostnames (example)          |
|--------|-------------------------------------------------|--------------------------------------|
| VM1    | Supabase (temp/supabase/docker + S3)            | supabase.yourdomain.com → Kong 8000  |
| VM2    | This compose (Flowise, n8n, Postgres, Redis, MinIO) | flowise, n8n, minio.yourdomain.com  |
| Portal | Next.js (local or Vercel)                      | Uses SUPABASE_MODE + tunnel URLs     |
