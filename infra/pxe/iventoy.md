# iVentoy PXE (MNKY datacenter)

## Current state

- **iVentoy host**: `MNKY-HQ` (`10.0.0.100`, also `101.0.0.100`)
- **ISO source of truth** (Proxmox NFS ISO store): `/mnt/pve/hyper-mnky-shared/template/iso`
- **iVentoy container**: `ziggyds/iventoy:latest` (community image)
- **Rollback target**: `netbootxyz` Docker container on `MNKY-HQ` (currently stopped)

## What this replaces

pfSense previously provided:

- **next-server**: `10.0.0.100`
- **BIOS bootfile**: `netboot.xyz.kpxe`
- **UEFI bootfile**: `netboot.xyz.efi`

This has been cut over to iVentoy bootfiles (below).

## How it works (high level)

- pfSense remains **authoritative DHCP** for each VLAN.
- pfSense hands out **option 66/67** (next-server + bootfile name) pointing at `MNKY-HQ` (`10.0.0.100`).
- Clients TFTP-download the iVentoy loader (`iventoy_loader_16000_*`) from `MNKY-HQ:69/udp`.
- The loader then uses iVentoy’s PXE HTTP service (`10.0.0.100:16000`) to present the ISO menu and boot selected images.
- iVentoy reads ISOs directly from the **same NFS-backed directory** Proxmox uses, so uploading ISOs in Proxmox automatically updates the iVentoy inventory.

## iVentoy ports (must be reachable to `10.0.0.100`)

- **UDP/69**: TFTP (bootfile download)
- **TCP/16000**: PXE HTTP service
- **TCP/26000**: iVentoy admin UI
- **TCP/10809**: NBD (used during some boot flows)

## DHCP mode

iVentoy is configured for **ExternalNet** (third-party DHCP on different VLANs).

- This disables iVentoy’s internal DHCP server (avoids conflicts with pfSense).
- pfSense must provide different bootfile names for BIOS vs UEFI (below).

## pfSense DHCP values (per VLAN interface)

Keep:

- **next-server / TFTP server**: `10.0.0.100`

Set:

- **BIOS/Legacy**: `iventoy_loader_16000_bios`
- **UEFI x86_64**: `iventoy_loader_16000_uefi`

Optional (only if you have these client types):

- **UEFI IA32**: `iventoy_loader_16000_ia32`
- **UEFI ARM64**: `iventoy_loader_16000_aa64`

Notes:

- The `16000` suffix must match iVentoy’s **PXE HTTP port** (default `16000`).
- If you change iVentoy’s PXE port, the bootfile names must change accordingly.

## Where iVentoy gets ISOs

On `MNKY-HQ`:

- NFS mount: `10.0.0.5:/mnt/HYPER-MNKY/proxmox/shared` (Proxmox storage: `hyper-mnky-shared`)
- ISO directory: `/mnt/pve/hyper-mnky-shared/template/iso`
- Bound into iVentoy container as `/app/iso` (read-only)

Operationally:

- Upload ISOs in the Proxmox GUI to **`hyper-mnky-shared`** → they land in `/mnt/pve/hyper-mnky-shared/template/iso` → iVentoy sees them.

## Container deployment (MNKY-HQ)

- Container name: `iventoy`
- Networking: `--net host`
- Persistence:
  - `/opt/iventoy/data` → `/app/data`
  - `/opt/iventoy/log` → `/app/log`
  - `/opt/iventoy/iso` (bind of the Proxmox NFS ISO dir) → `/app/iso` (read-only)

## Rollback

1. On pfSense, set bootfiles back to:
   - BIOS: `netboot.xyz.kpxe`
   - UEFI: `netboot.xyz.efi`
2. On `MNKY-HQ`:
   - Start the `netbootxyz` container.
   - Stop the `iventoy` container (optional).

