# MOOD MNKY Docker Compose Stack

Complete Docker Compose setup for the **MOOD MNKY DevOps Stack** (and **Agent Stack** with optional Ollama + Qdrant): Flowise, n8n, Redis, PostgreSQL, MinIO, and profile-based optional services for local AI and vector search.

---

## For new users

**What is this?** A single Docker Compose project that runs the apps behind MOOD MNKY: workflow automation (n8n), AI flows (Flowise), object storage (MinIO), plus optional local AI (Ollama) and vector search (Qdrant). You choose a **profile** so only the services you need start (e.g. base only, or base + Ollama + Qdrant for agents).

**When do I use it?** Use this stack when you want to run these services yourself—on your laptop, a server, or a VM we provision for you via the portal. The MOOD MNKY Portal uses Supabase for auth and multitenancy; this compose is the **backend app layer** (Flowise, n8n, etc.) that the portal connects to.

**Quick path:** Copy `.env.example` to `.env`, edit if needed, then run `docker compose --profile cpu up -d` for the standard setup with local Ollama. See [Quick Start](#quick-start) and [Profiles and packages](#profiles-and-packages) below.

---

## Documentation index

| Section | Use when you want to… |
|--------|------------------------|
| [Profiles and packages](#profiles-and-packages) | Choose which services run (base, Core, Agent, GPU). |
| [What you can build](#what-you-can-build) | See example use cases (agents, RAG, workflows). |
| [Quick Start](#quick-start) | Get the stack running in a few steps. |
| [Services](#services) | Understand each service (ports, roles, credentials). |
| [Supabase Modes](#supabase-modes) | Connect this stack to the Portal (local / cloud / self‑hosted). |
| [Configuration](#configuration) | Change passwords, ports, and env vars. |
| [Homelab / standalone](#homelab--standalone-deployment) | Deploy without Supabase Cloud (self‑hosted + tunnels). |
| [Troubleshooting](#troubleshooting) | Fix startup, ports, or connection issues. |
| [Provisioning](#provisioning) | Have a VM/LXC created and this stack deployed via Ansible (see `../provisioning/README.md`). |

---

## Profiles and packages

The stack uses Docker Compose **profiles** so you run only what you need. Base services (Postgres, Redis, MinIO, Flowise, n8n) always start; optional services are gated by profile.

| Package | Command | What runs |
|--------|---------|-----------|
| **Core** | `docker compose --profile cpu up -d` | Base + Ollama (CPU) |
| **Agent** | `docker compose --profile agent up -d` | Core + Qdrant + Ollama (CPU) |
| **Agent GPU (Nvidia)** | `docker compose --profile gpu-nvidia up -d` | Base + Ollama (Nvidia GPU) |
| **Agent GPU (AMD)** | `docker compose --profile gpu-amd up -d` | Base + Ollama (AMD ROCm) |
| **Supabase-aware** | Same as Core/Agent with Supabase MT vars in `.env` | Stack that works with the Portal; see [Supabase Modes](#supabase-modes). |

- **Base (no profile):** `docker compose up -d` — Postgres, Redis, MinIO, Flowise, n8n only.
- **Ollama** (CPU): `ollama-cpu` + one-time `ollama pull llama3.2` when using `--profile cpu` or `--profile agent`.
- **Qdrant:** vector store on port 6333 when using `--profile agent`.
- **Supabase-aware:** Not a separate profile; use Core or Agent and set `SUPABASE_MODE`, `NEXT_PUBLIC_SUPABASE_MT_URL`, and keys in `.env` so the stack integrates with the MOOD MNKY Portal.

### Which package should I choose?

| If you want… | Use this package |
|--------------|------------------|
| Only Flowise, n8n, Postgres, Redis, MinIO (no local AI) | Base: `docker compose up -d` (no profile). |
| Same as base plus a local LLM (Ollama) on CPU | **Core**: `--profile cpu`. |
| Core plus a vector DB for RAG/agents | **Agent**: `--profile agent`. |
| Local LLM using an Nvidia GPU | **Agent GPU (Nvidia)**: `--profile gpu-nvidia`. |
| Local LLM using an AMD GPU (ROCm) | **Agent GPU (AMD)**: `--profile gpu-amd`. |
| This stack to work with the MOOD MNKY Portal | Use Core or Agent and set Supabase-related vars in `.env`; see [Supabase Modes](#supabase-modes). |

## What you can build

- **AI agents** for scheduling, ops, and automation (n8n + Flowise + optional Ollama).
- **Secure document summarization** and private document analysis (Flowise, optional Qdrant).
- **Smarter bots and workflows** with local or cloud models (Ollama CPU/GPU or external APIs).
- **Workflow automation** with triggers, integrations, and AI nodes (n8n).
- **RAG and retrieval** when using the Agent profile (Qdrant + Ollama).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MOOD MNKY Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │   Flowise AI     │  │    n8n Workflow  │            │
│  │   (Port 3000)    │  │   (Port 5678)    │            │
│  └────────┬─────────┘  └────────┬─────────┘            │
│           │                     │                      │
│           └─────────────┬───────┘                      │
│                         │                              │
│           ┌─────────────┴──────────────┐               │
│           │                            │               │
│  ┌────────▼──────────┐     ┌──────────▼────────┐      │
│  │   PostgreSQL      │     │  Redis Cache      │      │
│  │   (Port 5432)     │     │  (Port 6379)      │      │
│  └───────────────────┘     └───────────────────┘      │
│           ┌────────▼──────────┐                         │
│           │  MinIO (S3)       │                         │
│           │  (9000 / 9001)    │                         │
│           └───────────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

## Services

### PostgreSQL (Port 5432)
- Shared database for Flowise and n8n
- Version: 15-Alpine
- Data persisted in `postgres_data` volume
- Health check enabled

### Redis (Port 6379)
- Cache layer for both Flowise and n8n
- Version: 7-Alpine
- Data persisted in `redis_data` volume
- Health check enabled

### MinIO (Ports 9000, 9001)
- S3-compatible object storage for Flowise artifacts and n8n binary data (optional).
- API: 9000; Console: 9001. Buckets `flowise-artifacts` and `n8n-binaries` are created on first run.
- Set `FLOWISE_STORAGE_TYPE=s3` and/or `BINARYDATA_STORAGE_TYPE=s3` in `.env` to use MinIO. Default is local/filesystem.
- In production, set `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` and optionally omit port exposure, using a reverse proxy for MinIO.

#### MinIO vs MinIO AIStor (recommended for AI workloads)
- **Default (this stack):** We use the Chainguard MinIO image (S3-compatible, no license). The [upstream MinIO community repo](https://github.com/minio/minio) is in maintenance mode; MinIO Inc. recommends AIStor for new deployments.
- **MinIO AIStor** is MinIO’s current product for AI/data workloads: same S3 API, optimized for scale, with a free tier (single-node, no HA). Features include small-object optimization, optional promptObject API, and Tables for agentic AI. [AIStor Free](https://www.min.io/download) is free; get a license and use the override below.
- **To use AIStor in this stack:**  
  1. Get a free license: [min.io/download](https://www.min.io/download) → AIStor Free → request license; save the file as `minio.license` in this directory.  
  2. Start with the override: `docker compose -f docker-compose.yml -f docker-compose.aistor.yml up -d`.  
  Do not commit `minio.license` (add it to `.gitignore`).

### Flowise AI Platform (Port 3000)
- Visual AI workflow builder
- Connects to PostgreSQL for workflow storage
- Uses Redis for caching
- Default credentials: admin / admin_password
- API documentation available at `http://localhost:3000/api-docs`

### n8n Workflow Automation (Port 5678)
- Workflow automation engine
- Connects to PostgreSQL for workflow persistence
- Uses Redis for queue management
- Default credentials: admin / admin_password
- UI available at `http://localhost:5678`
- When running with `--profile cpu` or `--profile agent`, can use local Ollama via `OLLAMA_HOST` (e.g. `ollama-cpu:11434`)

### Qdrant (Port 6333, profile: agent)
- Vector store for RAG and agent memory when using `--profile agent`
- Data persisted in `qdrant_data` volume

### Ollama (Port 11434, profiles: cpu / agent / gpu-nvidia / gpu-amd)
- Local LLM runtime. CPU: `--profile cpu` or `--profile agent`; GPU: `--profile gpu-nvidia` (Nvidia) or `--profile gpu-amd` (ROCm)
- One-time init containers pull `llama3.2` when the profile is first used
- Models stored in `ollama_data` volume

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- 2GB+ available RAM
- Ports 3000, 5432, 5678, 6379, 9000, 9001 available (9000/9001 for MinIO; optional in production)

### 2. Setup Environment

```bash
cd docker-compose
cp .env.example .env
# Edit .env if you need to change default values
```

For local dev with Supabase MT, optionally run:

```bash
# Start Supabase first: supabase start --workdir supabase-mt (from repo root)
./scripts/start-local.sh   # Pulls supabase status into .env
./scripts/validate-env.sh  # Validates required vars before compose up
```

### 3. Start the Stack

```bash
# Base only (no Ollama/Qdrant)
docker compose up -d

# Core: base + Ollama CPU (recommended for local AI)
docker compose --profile cpu up -d

# Agent: Core + Qdrant (for RAG / vector search)
docker compose --profile agent up -d

# GPU (Nvidia or AMD): base + Ollama with GPU
docker compose --profile gpu-nvidia up -d
# or
docker compose --profile gpu-amd up -d
```

### 4. Verify Services

```bash
docker-compose ps
```

All services should show `healthy` or `running` status.

### 5. Access Services

| Service | URL | Default Username | Default Password |
|---------|-----|------------------|------------------|
| Flowise | http://localhost:3000 | admin | admin_password |
| n8n | http://localhost:5678 | admin | admin_password |
| PostgreSQL | localhost:5432 | postgres | postgres_password |
| Redis | localhost:6379 | (no auth) | - |
| MinIO Console | http://localhost:9001 | MINIO_ROOT_USER | MINIO_ROOT_PASSWORD |

## Supabase Modes

The Portal connects to Supabase MT for auth and multitenancy. Set `SUPABASE_MODE` in `.env`:

| Mode | Description |
|------|-------------|
| `local` | Use `supabase start --workdir supabase-mt`. Values from `supabase status`. Run `./scripts/start-local.sh` to refresh. |
| `production` | Use Supabase Cloud. Set `NEXT_PUBLIC_SUPABASE_MT_URL`, `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY`, `SUPABASE_MT_SERVICE_ROLE_KEY` in `.env`. |
| `self_hosted` | Use your self-hosted Supabase. See `.env.supabase.example` and `temp/.env.example.supabase` for reference. |

**Note:** This compose stack runs Flowise and n8n. Supabase MT runs separately (`supabase start`) or via Supabase Cloud.

**Full self-hosted Supabase:** To run the full Supabase stack (studio, kong, auth, rest, realtime, storage, db, etc.), use the reference repo: from `temp/supabase/docker` run `docker compose -f docker-compose.yml -f docker-compose.s3.yml up` (adds MinIO for Supabase Storage). Set `SUPABASE_MODE=self_hosted` and `NEXT_PUBLIC_SUPABASE_MT_URL` (e.g. `http://host:8000` for Kong). This compose remains Flowise + n8n + Postgres + Redis + MinIO; the Supabase stack runs separately.

## Multitenancy

- **tenant_app_instances:** The Portal reads `base_url` per tenant for Flowise and n8n.
- **Local dev:** Seed `tenant_app_instances` with `http://localhost:3000` (Flowise) and `http://localhost:5678` (n8n) for the default tenant.
- **Production:** Set `WEBHOOK_URL` and Flowise/n8n URLs to your public host so `tenant_app_instances` can point to them.
- **Compose Postgres (5432)** is for Flowise/n8n only. Supabase local DB is on port 54502 — no conflict.

## Stack mapping

| Component | Role | Storage / DB |
|-----------|------|--------------|
| Portal | Next.js app; auth and tenant routing via Supabase | — |
| Supabase MT | Auth, RLS, `tenant_app_instances` (Flowise/n8n `base_url`) | Its own Postgres (local or Cloud) |
| Flowise | AI workflows; optional S3 (MinIO) for artifacts | Compose Postgres + optional MinIO |
| n8n | Workflow automation; optional S3 (MinIO) for binary data | Compose Postgres + Redis queue + optional MinIO |
| MinIO | S3-compatible blob storage for this stack | `minio_data` volume |
| Postgres (compose) | Flowise + n8n databases | `postgres_data` volume |
| Redis | Flowise cache, n8n queue | `redis_data` volume |

Supabase holds metadata (e.g. `storage_objects`); app uploads can use Supabase Storage (local/Cloud) or, when configured, MinIO with signed URLs. Buckets in this stack: `flowise-artifacts`, `n8n-binaries`. See [STACK-MAPPING.md](STACK-MAPPING.md) and [CHATGPT-MULTITENANT-APP-STACK.md](../CHATGPT-MULTITENANT-APP-STACK.md) for full architecture.

## Design decisions (open questions)

### 1. Portal in compose?

**What it means:** Should the Portal (Next.js app) run as a service inside this Docker Compose stack so that one `docker compose up` brings up the portal plus Flowise, n8n, Postgres, Redis, and MinIO?

**Decision:** The Portal stays **out of** this compose. Run the portal separately (local: `npm run dev` in the portal app; production: Vercel or your host). Use `.env` in the portal that points to this stack’s Supabase (local or Cloud) and to Flowise/n8n URLs (e.g. `http://localhost:3000`, `http://localhost:5678` for local). This keeps the compose stack focused on backend services. A simple frontend for the stack (e.g. a minimal UI to reach Flowise, n8n, MinIO console) may be considered later; it would be additive and not part of this compose.

### 2. Supabase stack inclusion (option B)

**What it means:** Should self-hosted Supabase be (A) document-only in the README, or (B) have a dedicated compose file that pulls in or references the Supabase stack?

**Decision (B):** We use a dedicated file [docker-compose.supabase.yml](docker-compose.supabase.yml) that documents how to run the full Supabase stack (from `temp/supabase/docker`) alongside this stack. That file does not define 14+ services here; it points you at the reference Supabase compose and the exact commands so Supabase inclusion is explicit and versioned. See [docker-compose.supabase.yml](docker-compose.supabase.yml) and the “Full self-hosted Supabase” note under Supabase Modes above.

## Homelab / standalone deployment

A full **standalone** deployment (no Supabase Cloud) is: **self-hosted Supabase from temp** + **this compose** + **Portal** (or a simple frontend). Supabase is the control plane (auth, RLS, `tenant_app_instances`); this compose provides Flowise, n8n, Postgres, Redis, and MinIO. Flowise and n8n already use their **own Postgres** in this stack (separate from Supabase), so "each their own Supabase instance" means **one Supabase instance per environment** (e.g. one for homelab), not one Supabase per app.

### Steps

1. **Self-hosted Supabase (from repo):** Use the reference stack in `temp/supabase/docker`. Copy `.env.example` to `.env`, run `./utils/generate-keys.sh`, set `SUPABASE_PUBLIC_URL` and `API_EXTERNAL_URL` to your public URLs (e.g. Cloudflare Tunnel). Then:
   ```bash
   cd temp/supabase/docker
   docker compose -f docker-compose.yml -f docker-compose.s3.yml up -d
   ```
2. **This stack:** In this directory, set `SUPABASE_MODE=self_hosted`, `NEXT_PUBLIC_SUPABASE_MT_URL` (Kong URL, e.g. `https://supabase.yourdomain.com`), and anon/service keys from the Supabase `.env`. Then `docker compose up -d`.
3. **Portal:** Run the Portal with the same env; `tenant_app_instances` should use the public URLs for Flowise and n8n (e.g. `https://flowise.yourdomain.com`, `https://n8n.yourdomain.com`).

Optionally use [scripts/standalone-up.sh](scripts/standalone-up.sh) to start Supabase from temp then this compose in one go (see script for prerequisites).

### Cloudflare Tunnels

Expose services without opening router ports: run `cloudflared` on each host and route hostnames to local ports.

| Service    | Example hostname              | Backend (host:port)   |
|-----------|--------------------------------|------------------------|
| Supabase  | `supabase.yourdomain.com`     | Kong `8000`            |
| Flowise   | `flowise.yourdomain.com`      | Flowise `3000`         |
| n8n       | `n8n.yourdomain.com`          | n8n `5678`             |
| MinIO UI  | `minio.yourdomain.com` (opt.) | MinIO console `9001`  |

Set `SUPABASE_PUBLIC_URL`, `API_EXTERNAL_URL`, and the Portal's `NEXT_PUBLIC_SUPABASE_MT_URL` to the Supabase tunnel URL (HTTPS). Use the same tunnel hostnames in `tenant_app_instances.base_url` for Flowise and n8n.

### VM/LXC specs (suggestions)

| Layout                | VM/LXC 1                                  | VM/LXC 2                          | VM/LXC 3 (optional)   |
|-----------------------|-------------------------------------------|-----------------------------------|------------------------|
| **Minimal (one VM)**  | Supabase (temp) + this compose on one host| —                                 | —                      |
| **Split (two VMs)**   | Supabase (temp): 4 GB RAM, 2 vCPU, 40 GB | This compose: 4 GB RAM, 2 vCPU, 50 GB | —                 |
| **With Nextcloud AIO**| Supabase: 4 GB, 2 vCPU                    | This compose: 4 GB, 2 vCPU        | Nextcloud AIO: 8 GB, 2 vCPU |

- **Reference Supabase:** ~2–4 GB RAM, 2 vCPU, 20–40 GB disk.
- **This compose:** ~2.5–3 GB RAM, 2 vCPU, 30–50 GB for volumes.
- **LXC:** Use unprivileged LXC with Docker; 4 GB RAM per container is a safe minimum. **VM:** 4 GB RAM, 2 vCPU, 50 GB disk per VM is a good starting point.

See [DEPLOY-HOMELAB.md](docs/DEPLOY-HOMELAB.md) for exact two-VM commands and tunnel config. For homelab, you can copy [docker-compose.override.example.yml](docker-compose.override.example.yml) to `docker-compose.override.yml` and set your tunnel hostnames (e.g. `WEBHOOK_URL`, `N8N_PROTOCOL`).

## Optional: Nextcloud AIO

Nextcloud AIO (All-in-One) is the **file plane** in the [CHATGPT-MULTITENANT-APP-STACK](../CHATGPT-MULTITENANT-APP-STACK.md) (folders, sharing, sync, collaboration). Supabase remains the system of record for metadata and permissions.

- **What it is:** A Docker image (`nextcloud/all-in-one`) whose mastercontainer mounts `/var/run/docker.sock` and manages its own containers. It is **not** a single service to add to this compose.
- **Recommendation:** Run Nextcloud AIO **separately** (same or different VM). Do not merge it into [docker-compose.yml](docker-compose.yml).
- **Run (example):**
  ```bash
  sudo docker run --sig-proxy=false --name nextcloud-aio-mastercontainer --restart always \
    --publish 80:80 --publish 8080:8080 --publish 8443:8443 \
    --volume nextcloud_aio_mastercontainer:/mnt/docker-aio-config \
    --volume /var/run/docker.sock:/var/run/docker.sock:ro \
    nextcloud/all-in-one:latest
  ```
  Then open port 8080 for initial setup; expose via Cloudflare Tunnel (e.g. `nextcloud.yourdomain.com` → 443) or reverse proxy.
- **Optional – MinIO:** Nextcloud can use S3 as primary storage. To use this stack's MinIO, create a bucket (e.g. `nextcloud`) and configure Nextcloud's primary object storage to that bucket (MinIO must be reachable from the Nextcloud host). See [docs/NEXTCLOUD-AIO.md](docs/NEXTCLOUD-AIO.md) for S3 primary storage and tunnel notes.
- **Resources:** 4 GB minimum; 8 GB+ recommended with Collabora/Imaginary and other options.

## Configuration

### Environment Variables

Edit `.env` to customize:

```bash
# Database
POSTGRES_DB=mood_mnky
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password

# Flowise
FLOWISE_DB_NAME=flowise
FLOWISE_USERNAME=admin
FLOWISE_PASSWORD=admin_password

# n8n
N8N_DB_NAME=n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin_password
```

### Port Mapping

To use different ports, modify `docker-compose.yml`:

```yaml
services:
  flowise:
    ports:
      - "8000:3000"  # Access at localhost:8000
  
  n8n:
    ports:
      - "8080:5678"  # Access at localhost:8080
```

## Database Management

### Connect to PostgreSQL

```bash
psql -h localhost -U postgres -d mood_mnky
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres mood_mnky > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres mood_mnky < backup.sql
```

## Flowise Configuration

### Initialize Flowise

1. Access http://localhost:3000
2. Login with default credentials (admin / admin_password)
3. Change password immediately
4. Create your first chatflow or assistant

### Connect to Flowise API

```bash
curl -X GET http://localhost:3000/api/v1/chatflows \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Get your API key from Flowise UI: Settings → API Keys

## n8n Configuration

### Initialize n8n

1. Access http://localhost:5678
2. Login with default credentials (admin / admin_password)
3. Change password immediately
4. Create your first workflow

### Connect Supabase to n8n

1. In n8n, go to Credentials
2. Add new "PostgreSQL" credential
3. Fill in connection details:
   - Host: `postgres` (or your Supabase host)
   - Port: `5432`
   - Database: `n8n` or your database name
   - User: `postgres` (or your user)
   - Password: Your PostgreSQL password

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs flowise
docker-compose logs n8n
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Port conflicts

```bash
# Find what's using a port
lsof -i :3000

# Or modify docker-compose.yml to use different ports
```

### Database connection issues

```bash
# Verify PostgreSQL is running
docker-compose exec postgres pg_isready -U postgres

# Check Redis connectivity
docker-compose exec redis redis-cli ping
```

### Recreate volumes (WARNING: deletes data)

```bash
docker-compose down -v
docker-compose up -d
```

## Production Deployment

### For AWS / DigitalOcean / Azure

1. Copy entire `docker-compose` directory to your server
2. Update `.env` with production values
3. Use strong passwords
4. Configure reverse proxy (nginx) for SSL/TLS
5. Set up automated backups
6. For S3-backed runs: set MinIO credentials and bucket names in `.env`; MinIO ports can be closed to host and accessed via reverse proxy

### Example Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name flowise.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backup Strategy

```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups/mood_mnky"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U postgres mood_mnky > $BACKUP_DIR/mood_mnky_$DATE.sql
docker volume inspect mood_mnky_flowise_data >> $BACKUP_DIR/flowise_metadata_$DATE.txt
```

## Health Checks

Services include built-in health checks. Monitor them:

```bash
# View health status
docker-compose ps

# Manual checks
docker-compose exec postgres pg_isready -U postgres
docker-compose exec redis redis-cli ping
docker-compose exec flowise curl -s http://localhost:3000/health
docker-compose exec n8n curl -s http://localhost:5678/healthz
```

## Performance Tuning

### For High Load

```yaml
# Increase resource limits in docker-compose.yml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### Enable PostgreSQL Replication (Optional)

See PostgreSQL documentation for replication setup across multiple servers.

## Documentation Links

- [Flowise Documentation](https://docs.flowiseai.com/)
- [n8n Documentation](https://docs.n8n.io/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## Support

For issues:

1. Check service logs: `docker-compose logs SERVICE_NAME`
2. Verify environment variables in `.env`
3. Ensure ports are available: `netstat -tuln`
4. Review official documentation links above
5. Check GitHub issues for common problems

## Provisioning (portal + Ansible)

Partners can request the **full MOOD MNKY DevOps or Agent stack** from the portal. A platform admin then uses Ansible to create a VM or LXC on Proxmox and deploy this Docker Compose stack on it. The compose project in this directory is what gets copied to the target host and run with the chosen profile.

- **Portal:** Partners choose a package (Core, Agent, Agent GPU, Supabase-aware) and specs (CPU, RAM, disk). That creates a row in `tenant_stack_subscriptions`.
- **Ansible:** See [../provisioning/README.md](../provisioning/README.md) for playbooks, env vars, and how to create the VM and run `docker compose --profile <profile> up -d` on the new host.
- **Prepare for deploy:** Copy or symlink this `docker-compose` directory into `provisioning/files/compose` before running the deploy playbook so Ansible can copy it to the target.

## License

This Docker Compose configuration is part of MOOD MNKY and follows the same license terms.
