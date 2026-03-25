# MNKY media stack (MOOD-MNKY)

Docker Compose stack for **Jellyfin**, **qBittorrent**, **Jackett**, **Prowlarr**, **Sonarr**, **Radarr**, **Lidarr**, and **Jellyseerr**. Intended to run in a **privileged LXC** on **MOOD-MNKY** with Intel iGPU passthrough for Jellyfin **Intel Quick Sync / VA-API**.

**Current deployment:** Proxmox **MOOD-MNKY**, LXC **120** (`mnky-media-stack`), IP **10.1.0.x** (DHCP on VLAN 10).

**Prior stack:** CODE-MNKY LXC **3103** remains documented as the previous media host until you cut over fully.

## SSH (LXC)

SSH is enabled on the LXC with **root password authentication** (drop-in: `/etc/ssh/sshd_config.d/50-root-ssh.conf`). The root password is set to match your private **`PROXMOX_MOOD_MNKY_PASSWORD`** from `datacenter.env` (same convention as other MNKY infra logins). Use **`ssh root@<LXC-LAN-IP>`** (port 22).

`/run/sshd` is recreated on boot via `/etc/tmpfiles.d/sshd-run.conf` so `sshd` can start cleanly after reboot.

## Web UIs (no universal default password)

There is **no single default password** for every app. Typical first-time behavior:

| App | Login |
| --- | --- |
| **qBittorrent** | Username **`admin`**. A **one-time random password** is printed in container logs: `docker logs qbittorrent` (linuxserver.io). Web UI URL on the LAN: **`http://<LXC-IP>:8081`**. |
| **Jellyfin** | First-run wizard creates the admin user (you choose username/password). |
| **Sonarr / Radarr / Lidarr / Prowlarr** | Usually no auth until you enable authentication in each app’s settings. |
| **Jackett** | No login by default; optional admin password in UI. **`http://<LXC-IP>:9117`**. |
| **Jellyseerr** | First-run wizard. |

## qBittorrent Web UI (`401 Unauthorized` from the LAN IP)

The **linuxserver/qbittorrent** image does **not** read generic `WEBUI_USERNAME` / `WEBUI_PASSWORD` environment variables for a permanent password (it only prints a **one-time random password** in `docker logs qbittorrent` until you save a password in the app).

qBittorrent v5 may also refuse the Web UI for requests to the **LAN IP/hostname** until **`web_ui_host_header_validation_enabled`** is turned off (symptom: plain-text **`Unauthorized`** instead of the login HTML). After first boot, run:

```bash
cd /opt/mnky-media-stack
chmod +x scripts/setup-qbittorrent-webui.sh   # once
# Ensure QB_WEBUI_USERNAME / QB_WEBUI_PASSWORD are in .env (see datacenter.env pattern)
./scripts/setup-qbittorrent-webui.sh
```

That script logs in via the **local** API (`127.0.0.1:8080` inside the `qbittorrent` container), sets your password, disables host-header validation for remote browsers, and enables **`bypass_local_auth`** so **Gluetun** can call the API for port forwarding.

### Sonarr / Radarr / Lidarr — root folders + qBittorrent (API)

After **`QB_WEBUI_USERNAME`** and **`QB_WEBUI_PASSWORD`** are in `.env` (same as qBittorrent setup), run once on the LXC:

```bash
cd /opt/mnky-media-stack
chmod +x scripts/bootstrap-arr-apps.py   # once
python3 scripts/bootstrap-arr-apps.py
```

This adds **root folders** (`/tv`, `/movies`, `/music` per compose mounts) and a **qBittorrent** download client pointing at host **`qbittorrent`**, port **8080**, with default categories (`tv-sonarr`, `radarr`, `lidarr`). Safe to re-run; it skips what already exists.

## Jackett + Prowlarr (Torznab “all”)

**Jackett** exposes many tracker definitions as Torznab. **Prowlarr** can use a single **Generic Torznab** indexer pointed at Jackett’s **all** feed: `http://jackett:9117/api/v2.0/indexers/all/results/torznab/` (inside Docker).

1. Copy a TrueNAS Jackett export into **`_truenas-export/jackett/`** (gitignored; rsync from TrueNAS — see `truenas-indexer-inventory.md`).
2. Start Jackett once: `docker compose up -d jackett`
3. Merge configs: `./scripts/apply-truenas-jackett-config.sh` (copies `Indexers/` + patches `ServerConfig.json` to port **9117**).
4. Add Prowlarr indexer: `python3 scripts/bootstrap-prowlarr-jackett.py` (reads Jackett **APIKey** from `config/jackett/Jackett/ServerConfig.json`).

Then **Settings → Apps → Sync App Indexers** (or full sync) so Sonarr/Radarr/Lidarr see the new indexer. You can still add native **Cardigann** indexers in Prowlarr alongside Jackett.

## Jellyfin credentials

**Jellyfin** has **no** standard Docker env vars for an initial admin user/password on the LinuxServer image. Complete the **first-run wizard** in the UI (typically `http://<LXC-IP>:8096`) and choose the admin account there.

## qBittorrent + ProtonVPN (Gluetun)

Torrent traffic runs through **[Gluetun](https://github.com/qdm12/gluetun)** (`qmcgaw/gluetun`) using **ProtonVPN WireGuard** and **provider port forwarding**. The `qbittorrent` container uses `network_mode: service:gluetun`, so only Gluetun has published ports for the Web UI (`8081` → `8080` inside the stack).

### LXC prerequisites

- **`/dev/net/tun`** inside the LXC (Proxmox: `lxc.cgroup2.devices.allow: c 10:200 rwm` and bind-mount `dev/net/tun`), or Gluetun cannot bring WireGuard up.

### Secrets / env

Set **`PROTONVPN_WIREGUARD_PRIVATE_KEY`** (and optional filters like **`PROTONVPN_SERVER_COUNTRIES`**) via a **`.env`** file next to `docker-compose.yml` or exported in the shell. See **`.env.example`**.

Narrow **`GLUETUN_FIREWALL_OUTBOUND_SUBNETS`** to your LAN/NFS ranges (e.g. TrueNAS + MOOD-MNKY). **Do not** use a huge `10.0.0.0/8` if Proton’s tunnel uses `10.2.0.0/…` — overlap breaks Proton NAT-PMP / port forwarding (see [Gluetun firewall docs](https://github.com/qdm12/gluetun-wiki/blob/main/setup/options/firewall.md)).

### qBittorrent Web UI + port-forward hook

Gluetun runs the upstream **`VPN_PORT_FORWARDING_UP_COMMAND`** to call qBittorrent’s API on `127.0.0.1:8080`. That requires **Web UI → “Bypass authentication for clients on localhost”** enabled (preference `bypass_local_auth`), per [Gluetun’s qBittorrent example](https://github.com/qdm12/gluetun-wiki/blob/main/setup/advanced/vpn-port-forwarding.md). **`scripts/setup-qbittorrent-webui.sh`** sets this via API, then **restarts Gluetun** and syncs **`listen_port`** to Proton’s forwarded port (see script output).

**Default `6881` vs Proton:** The linuxserver image often leaves **Listening Port** at **6881** until the hook succeeds. Inbound peers use **Proton’s forwarded port** (e.g. `61865`), not 6881. If they diverge, Gluetun logged **403** on `setPreferences` because **`bypass_local_auth` was not set yet** when the VPN first came up—re-run the setup script or sync manually (script prints a one-liner).

### UPnP / NAT-PMP (pfSense and qBittorrent)

- **In qBittorrent:** keep **UPnP / NAT-PMP disabled** (the compose hook sets `upnp: false`). Port forwarding is handled by **Proton + Gluetun**, not your LAN router.
- **On pfSense WAN:** enabling **UPnP / NAT-PMP** does **not** open the Proton VPN forwarded port; inbound BitTorrent peers hit the **VPN exit IP**, not your home WAN. Turning WAN UPnP on can expose **other** LAN apps—usually **not worth it** for this stack. A static **NAT port forward to 6881** on your public IP is **redundant** while torrenting only through Gluetun.

### qBittorrent categories

Categories are **not** pre-created by Sonarr/Radarr/Lidarr in the abstract. Each *arr app uses the **category name** you set on its **Download Client** entry (e.g. `tv`, `movies`, `music`). qBittorrent typically **creates the category when the first torrent is sent** with that label. An empty category list until the first grab is normal.

### FlareSolverr (TrueNAS vs this stack)

To offload CPU from TrueNAS, Prowlarr can use the **existing** ix-app on **`10.0.0.5`**. On that host, **8191 is not published** to the host interface; the container maps **`31027/tcp` → 31027** (API path **`/v1`**). From this LXC, use:

**`http://10.0.0.5:31027/`** (FlareSolverr base URL; Prowlarr adds `/v1` as needed.)

Add an **Indexer proxy** in Prowlarr: **Settings → Indexers → Indexer proxies → +** → **FlareSolverr**, host **`http://10.0.0.5:31027/`**. Leave **tags** empty so all indexers can use it (or restrict with tags). Ensure **`GLUETUN_FIREWALL_OUTBOUND_SUBNETS`** includes **`10.0.0.0/24`** so the stack can reach TrueNAS.

### How much can Docker Compose configure?

| Area | Compose / env | Usually needs UI or API once |
| --- | --- | --- |
| qBittorrent password + localhost bypass + port sync | **Script** `setup-qbittorrent-webui.sh` | First boot only |
| Gluetun / Proton | **Yes** | Keys in `.env` |
| Jellyfin admin | No | First-run wizard |
| Sonarr / Radarr / Lidarr root folders + download client | Volumes in compose; **`scripts/bootstrap-arr-apps.py`** | Run once after `.env` has qBittorrent password; then only **Prowlarr indexers / sync** and **Jellyfin** need UI |
| Prowlarr indexers + app sync | **`bootstrap-prowlarr-jackett.py`** for Jackett “all” | **Sync Apps** to *arr in UI |
| Jackett config from TrueNAS | **`apply-truenas-jackett-config.sh`** | Rsync export to `_truenas-export/jackett/` first |
| Prowlarr FlareSolverr (indexer proxy) | **API** (`POST /api/v1/indexerProxy`) or UI | One-time; see FlareSolverr section |
| Jellyseerr | No | Wizard + Jellyfin URL |

Future improvement: small **API bootstrap scripts** (reading each app’s `config.xml` **ApiKey**) can reduce UI work; not all settings are exposed cleanly via env in LinuxServer images.

### Hostname for *arr apps

The `gluetun` service has a Docker network alias **`qbittorrent`**, so Sonarr/Radarr/Lidarr can keep using host **`qbittorrent`** and port **`8080`** as the download client.

### pfSense / WAN

With VPN + Proton forwarded port, **WAN NAT to `6881` is optional** (your home IP is no longer the BitTorrent source). If you keep legacy rules, they do not provide inbound peers on the Proton IP; inbound peers use the **forwarded port on the VPN exit IP**.

## Storage

- **TrueNAS NFS:** `10.0.0.5:/mnt/HYPER-MNKY/PRO-MNKY/Media` mounted in the LXC at **`/mnt/media`** (see `/etc/fstab`).
- **Layout:** `Movies`, `Shows`, `Music`, `Downloads`, `Books`, `Private` — Compose binds these for *arr and Jellyfin.
- **App config:** `./config/*` on the LXC root disk (not on NFS), alongside this `docker-compose.yml` (typically `/opt/mnky-media-stack`).

## Proxmox LXC (GPU)

On the **host**, the CT config includes:

- `features: nesting=1,keyctl=1`
- `unprivileged: 0` (privileged)
- `lxc.cgroup2.devices.allow: c 226:* rwm`
- `lxc.mount.entry: /dev/dri dev/dri none bind,optional,create=dir`

**Networking:** use `bridge=vmbr0,tag=10` (not a dedicated `vmbr0.10` interface) if LXC fails to start with `vmbr0.10`.

**ZFS note:** If `local-zfs` LXC creation fails with `no mountpoint set`, add **directory** storage (`pvesm add dir ... --content rootdir`) and create the CT on that store (MOOD-MNKY uses `mood-lxc-root`).

## Jellyfin transcoding

In Jellyfin **Dashboard → Playback**, enable **Intel QuickSync (QSV)** or **VA-API** and select the render device. Confirm with a transcode test and inspect logs for hardware encode.

## *arr wiring

1. **Prowlarr:** add indexers, then **Sync App** to Sonarr, Radarr, Lidarr. Optional: add **FlareSolverr** as an **indexer proxy** (see FlareSolverr section above).
2. **Download client:** point Sonarr/Radarr/Lidarr at host **`qbittorrent`**, port **8080** (Docker alias → Gluetun; see Gluetun section above).
3. **Jellyseerr:** connect to Jellyfin URL (e.g. `http://jellyfin:8096` or the LAN IP).

**Jackett** is included in **`docker-compose.yml`**; use **`bootstrap-prowlarr-jackett.py`** after importing configs so Prowlarr gets the **all-indexers** Torznab feed.

## NetBird

Install the **NetBird client inside the LXC** (not only on the hypervisor) so the workload is a first-class peer.

- Use **`NETBIRD_MANAGEMENT_URL`** from your private env (e.g. `https://netbird.moodmnky.com`).
- Join with a **setup key** from the NetBird dashboard (do not commit keys to git).
- Assign the peer to the **`Datacenter`** group so RFC1918 routes (e.g. **10.1.0.0/24**) apply.
- Restrict access with **access policies** if services should not be reachable by all Datacenter peers.

## Ports (host)

| Service     | Port |
|------------|------|
| Jellyfin   | 8096 |
| qBittorrent WebUI (via Gluetun) | 8081 |
| Prowlarr   | 9696 |
| Jackett    | 9117 |
| Sonarr     | 8989 |
| Radarr     | 7878 |
| Lidarr     | 8686 |
| Jellyseerr | 5055 |

## Commands

```bash
cd /opt/mnky-media-stack   # or your install path
docker compose pull
docker compose up -d
```

## Ownership

NFS exports may use mixed `uid/gid`. This stack uses **PUID/PGID 0** (root) for compatibility with existing permissions; tighten to dedicated service users if you standardize ownership on TrueNAS.
