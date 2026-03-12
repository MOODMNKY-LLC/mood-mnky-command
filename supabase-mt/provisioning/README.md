# MOOD MNKY Stack Provisioning (Ansible + Proxmox)

End-to-end automation: **create** a VM or LXC on Proxmox via the API, then **deploy** the chosen Docker Compose profile (MOOD MNKY DevOps/Agent stack) on that host.

---

## For new users

**What is this?** Scripts and playbooks that create a virtual machine (or container) on a Proxmox server and then install Docker and run the MOOD MNKY stack (Flowise, n8n, Postgres, Redis, MinIO, and optionally Ollama and Qdrant) on that machine. Partners request a “package” and specs in the portal; a platform admin runs these playbooks to fulfill the request.

**Who runs it?** A **platform admin** (or DevOps) with access to your Proxmox host and the provisioning repo. Partners do not run Ansible themselves; they submit a request in the portal, and the admin runs the playbooks (manually in v1).

**High-level flow:**

1. Partner (or org admin) goes to the portal dashboard → “Request full stack” → selects package (e.g. Agent) and specs (CPU, RAM, disk) → submits.
2. A row is created in `tenant_stack_subscriptions` with status `requested`.
3. Platform admin runs **Playbook 1** to create a VM on Proxmox with those specs.
4. Platform admin gets the new VM’s IP (from Proxmox or cloud-init), then runs **Playbook 2** to install Docker on that VM, copy the compose project, and run `docker compose --profile <profile> up -d`.
5. Admin updates the subscription row (e.g. `status = running`, `vm_id`, `proxmox_node`) in the portal or DB.

**Quick reference:** See [Quick reference](#quick-reference) at the end for copy-paste commands. For full context, read [Overview](#overview) and [What you need to install](#what-you-need-to-install).

---

## Documentation index

| Section | Use when you want to… |
|--------|------------------------|
| [Overview](#overview) | Understand the two playbooks and how they fit the portal. |
| [What you need to install](#what-you-need-to-install) | Install Ansible, collections, and prepare Proxmox and targets. |
| [Environment variables](#environment-variables) | Set Proxmox and deploy secrets (and where to store them). |
| [Playbooks](#playbooks) | Run “create VM” and “deploy stack” with the right options. |
| [Package → profile mapping](#package--compose-profile-mapping) | Map portal package names to `--profile` values. |
| [First-time setup](#first-time-setup) | Do a full first run from zero (template, compose copy, run). |
| [Security](#security) | Use tokens, vault, and SSH best practices. |
| [Updating subscription status](#updating-subscription-status) | Record VM id and status in the portal after a run. |
| [Troubleshooting](#troubleshooting) | Fix common Ansible and Proxmox issues. |
| [Quick reference](#quick-reference) | Copy-paste command cheat sheet. |

---

## Overview

1. **Create VM (Playbook 1)**  
   Ansible uses the Proxmox API to create a VM (clone from a template) with the requested CPU, RAM, and disk. The playbook starts the VM. You then obtain its IP (Proxmox UI, cloud-init, or your automation) for the next step.

2. **Deploy stack (Playbook 2)**  
   Ansible targets that VM by IP, installs Docker (and Docker Compose plugin), copies the MOOD MNKY `docker-compose` project (and optionally `.env`) to the host, and runs `docker compose --profile <profile> up -d`. The profile (e.g. `cpu`, `agent`, `gpu-nvidia`) comes from the partner’s chosen package.

**Data flow:** Subscription specs (package, CPU, RAM, disk) live in the table `tenant_stack_subscriptions` in Supabase. In v1 you pass these as extra vars or look them up manually; the playbooks do not read from the API yet. After a successful run, you update that row with `vm_id`, `proxmox_node`, and `status = 'running'` (or `failed` on error).

**Deployment options:** Ansible + Proxmox is the primary path for full-stack requests from the portal. [Coolify](https://coolify.io) can be used in parallel: the portal has a Coolify app instance and admin panel (see [portal/docs/BACKOFFICE-COOLIFY.md](../portal/docs/BACKOFFICE-COOLIFY.md)). You can create a Coolify project per tenant or per subscription and deploy the same stack via Coolify on designated servers; optionally store Coolify project/server UUIDs on the subscription for traceability.

## What you need to install

### On your machine (Ansible control node)

- **Ansible** 2.14+ (e.g. `pip install ansible` or system package).
- **Python** 3.9+.
- **Collections**:
  ```bash
  ansible-galaxy collection install community.general community.docker
  ```
  Optional for Docker on target: `ansible-galaxy collection install geerlingguy.docker` or use `community.docker.docker_compose`.

### On Proxmox VE (already assumed)

- Proxmox VE installed and reachable (API on port 8006).
- A user (e.g. `root@pam` or `ansible@pve`) with privileges to create and manage VMs/LXCs.
- Either:
  - **Password**: set `PROXMOX_API_PASSWORD`, or
  - **API token**: set `PROXMOX_API_TOKEN_ID` and `PROXMOX_API_TOKEN_SECRET` (recommended).

### On the target VM/LXC (after creation)

- SSH access (key-based recommended). Ansible will install Docker and Docker Compose on the target via the deploy playbook.

## Environment variables

Store Proxmox and deploy secrets in a **non-committed** place: e.g. a local `.env` (add to `.gitignore`), Ansible Vault, or your CI secrets. **Do not commit secrets to the repo.**

### Proxmox (Playbook 1 – create VM)

| Variable | Required | Description |
|----------|----------|-------------|
| `PROXMOX_API_HOST` | Yes | Proxmox host (e.g. `192.168.1.10` or `pve.example.com`). Use hostname or IP. |
| `PROXMOX_API_USER` | Yes | Proxmox user (e.g. `root@pam` or `ansible@pve`). |
| `PROXMOX_API_PASSWORD` | If no token | Password for `PROXMOX_API_USER`. |
| `PROXMOX_API_TOKEN_ID` | If no password | API token name (e.g. `ansible`). Prefer token over password when possible. |
| `PROXMOX_API_TOKEN_SECRET` | If no password | API token secret. |
| `PROXMOX_NODE` | Yes | Proxmox node name (e.g. `pve`). The node where the VM will be created. |
| `PROXMOX_STORAGE` | No (has default) | Storage for VM disks (e.g. `local-lvm`). Default in playbook: `local-lvm`. |
| `PROXMOX_TEMPLATE_VM` | Yes | Name or vmid of the VM template to clone (e.g. `debian-12-cloud`). You must create this template once on Proxmox. |

You must set either password or token; the playbook checks for both.

### Deploy (Playbook 2 – stack on target)

The deploy playbook copies the compose project to the target. The **compose** `.env` on the target (or a template you generate) should contain the same variables as in `docker-compose/.env.example`:

- **Database:** `POSTGRES_*`, `FLOWISE_DB_NAME`, `N8N_DB_NAME`, etc.
- **MinIO:** `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, bucket names.
- **Flowise / n8n:** usernames and passwords, ports.
- **Supabase-aware:** If the partner chose a Supabase-aware package, add `SUPABASE_MODE`, `NEXT_PUBLIC_SUPABASE_MT_URL`, `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY`, `SUPABASE_MT_SERVICE_ROLE_KEY` so the stack can talk to the Portal.

You can build the target `.env` from a template (e.g. Jinja2) and inject secrets from Vault or env; the playbook does not create `.env` for you by default (see playbook comments).

## Playbooks

### 1. Create VM on Proxmox

```bash
cd provisioning
ansible-playbook playbooks/proxmox_create_vm.yml \
  -e "vm_name=mood-stack-001" \
  -e "subscription_id=<uuid-from-portal>" \
  -e "spec_cpu=2" \
  -e "spec_ram_mb=4096" \
  -e "spec_disk_gb=50"
```

Or pass subscription from portal/DB and look up specs (see playbook vars). The playbook clones `PROXMOX_TEMPLATE_VM`, sets CPU/RAM/disk, and starts the VM. Output: `vm_id` and (if available) VM IP.

**Requirements**: A Proxmox VM template (e.g. Debian 12 cloud image) must exist. Create it once (upload cloud image, create VM from it, convert to template).

### 2. Deploy stack on the host

After the VM is created and you have its IP (from Proxmox or cloud-init):

```bash
# Copy compose project into provisioning (once)
cp -r ../docker-compose provisioning/files/compose
# Or symlink: ln -s ../../docker-compose provisioning/files/compose

# Target host and package (compose profile)
ansible-playbook playbooks/deploy_stack.yml \
  -i "192.168.1.20," \
  -e "compose_profile=agent" \
  -e "ansible_user=debian"
```

- `compose_profile`: one of `cpu`, `agent`, `gpu-nvidia`, `gpu-amd` (maps to package).
- Copy `docker-compose/` (and `.env`) to the target, then run `docker compose --profile <compose_profile> up -d`.

## Package → Compose profile mapping

| Package (portal) | Compose profile |
|------------------|-----------------|
| core | cpu |
| agent | agent |
| agent-gpu-nvidia | gpu-nvidia |
| agent-gpu-amd | gpu-amd |
| supabase | cpu or agent (same; .env includes Supabase vars) |

## First-time setup

Do this once before you run the playbooks for the first time.

1. **Proxmox**
   - Install Proxmox VE and ensure the API is reachable (e.g. `https://<PROXMOX_API_HOST>:8006`).
   - Create a user or API token with rights to create and manage VMs on the target node. Note `PROXMOX_API_USER` and password or token.
   - Create a **VM template** (e.g. Debian 12 cloud image): create VM from ISO/cloud image, install, optionally cloud-init, then convert to template. Set `PROXMOX_TEMPLATE_VM` to that template’s name or vmid.
   - Note your node name (e.g. `pve`) for `PROXMOX_NODE`.

2. **Ansible control node (your machine or runner)**
   - Install Ansible 2.14+ and Python 3.9+.
   - Install collections: `ansible-galaxy collection install community.general community.docker`.
   - Export or vault the Proxmox variables listed above so Playbook 1 can connect.

3. **Compose project for deploy**
   - From the repo root: `cp -r supabase-mt/docker-compose supabase-mt/provisioning/files/compose` (or symlink). Playbook 2 copies `provisioning/files/compose` to the target; it must contain `docker-compose.yml` and optionally `.env` or a template.

4. **Portal**
   - Ensure `tenant_stack_subscriptions` exists (migration applied). Partners can then submit requests; you use the subscription id or pass package/specs by hand when running the playbooks.

After that, for each new subscription you: run Playbook 1 (create VM) → get IP → run Playbook 2 with that IP and the right `compose_profile`.

## Security

- Use **API tokens** instead of password where possible; limit token scope to the node/storage needed.
- Store `PROXMOX_*` and compose secrets in **Ansible Vault** or a secrets manager; use `--ask-vault-pass` or `ANSIBLE_VAULT_PASSWORD_FILE`.
- Use **SSH keys** for target hosts; avoid password auth for Ansible.
- Do not commit `.env` or vault passwords; add them to `.gitignore` or use a secrets backend.

## Updating subscription status

After a successful run, update `tenant_stack_subscriptions` in the portal (or via API) to set `status = 'running'`, `vm_id` or `lxc_id`, and `proxmox_node`. For v1 this is manual (e.g. in Supabase dashboard or a small admin script). Later, an Ansible callback or webhook can POST to an API to update status automatically.

## Troubleshooting

| Issue | What to check |
|-------|-------------------------------|
| Playbook 1 fails with “Unauthorized” or 401 | Verify `PROXMOX_API_HOST`, `PROXMOX_API_USER`, and password or token. Ensure the user/token has VM create rights on the node. |
| Playbook 1 fails with “template not found” | Set `PROXMOX_TEMPLATE_VM` to the exact name or vmid of an existing template on `PROXMOX_NODE`. |
| Playbook 2 fails with “Permission denied” (SSH) | Ensure your SSH key is added to the target VM (e.g. via cloud-init or template). Use `ansible_user` that exists on the image. |
| Playbook 2 fails copying compose | Ensure `provisioning/files/compose` exists and contains `docker-compose.yml`. Run the copy/symlink step from [First-time setup](#first-time-setup). |
| Docker or compose not found on target | Playbook 2 uses `community.docker.docker_compose_v2`; the target must have Docker and the Compose plugin. The included `install_docker.yml` task targets Debian/Ubuntu; adapt for other OS. |
| Stack starts but services are unhealthy | On the target, run `docker compose --profile <profile> ps` and `docker compose logs`. Check the compose `.env` (passwords, ports) and that the profile matches the package (e.g. `agent` → `--profile agent`). |

## Quick reference

**Create VM (replace vars or export env):**
```bash
cd supabase-mt/provisioning
ansible-playbook playbooks/proxmox_create_vm.yml \
  -e "vm_name=mood-stack-001" \
  -e "spec_cpu=2" \
  -e "spec_ram_mb=4096" \
  -e "spec_disk_gb=50"
# Then note the VM id and get its IP (Proxmox UI or cloud-init).
```

**Deploy stack on that VM (replace IP and user):**
```bash
# One-time: ensure compose is in place
cp -r ../docker-compose files/compose   # or symlink

ansible-playbook playbooks/deploy_stack.yml \
  -i "192.168.1.20," \
  -e "compose_profile=agent" \
  -e "ansible_user=debian"
```

**Package → profile:** `core` → `cpu`; `agent` → `agent`; `agent-gpu-nvidia` → `gpu-nvidia`; `agent-gpu-amd` → `gpu-amd`; `supabase` → `cpu` or `agent` (same; set Supabase vars in compose `.env`).
