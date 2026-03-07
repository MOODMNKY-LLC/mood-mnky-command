# Optional: Nextcloud AIO

Nextcloud All-in-One (AIO) is the **file plane** in the MOOD MNKY stack (see [CHATGPT-MULTITENANT-APP-STACK](../../CHATGPT-MULTITENANT-APP-STACK.md)): folders, sharing, sync, collaboration. Supabase remains the system of record for metadata and permissions.

## Why run it separately

- Nextcloud AIO uses a **mastercontainer** that mounts `/var/run/docker.sock` and spawns its own containers. It is not a single service to add to [../docker-compose.yml](../docker-compose.yml).
- Running AIO separately (same or different VM) keeps the main compose simple and avoids Docker socket exposure in the same stack.

## Run Nextcloud AIO

```bash
sudo docker run --sig-proxy=false --name nextcloud-aio-mastercontainer --restart always \
  --publish 80:80 --publish 8080:8080 --publish 8443:8443 \
  --volume nextcloud_aio_mastercontainer:/mnt/docker-aio-config \
  --volume /var/run/docker.sock:/var/run/docker.sock:ro \
  nextcloud/all-in-one:latest
```

- **8080:** AIO setup UI (initial config, domain, admin).
- **80 / 8443:** HTTP/HTTPS for ACME and AIO UI; after setup, expose Nextcloud via reverse proxy or Cloudflare Tunnel on 443.

Do not change the container name or the config volume name; AIO updates rely on them.

## Cloudflare Tunnel

Point a hostname (e.g. `nextcloud.yourdomain.com`) at the Nextcloud server. If Nextcloud listens on 443 behind a reverse proxy, tunnel to that proxy; otherwise tunnel to the AIO Apache container port (typically 11000 after setup—see AIO docs). Use HTTPS in `overwrite.cli.url` and `overwritehost` so Nextcloud generates correct URLs.

## S3 / MinIO as primary storage (optional)

To use this stack’s MinIO for Nextcloud primary storage:

1. **Create a bucket** in MinIO (e.g. `nextcloud`). With the main compose running, use MinIO console (port 9001) or `mc mb` against the same MinIO endpoint.
2. **Reach MinIO from Nextcloud:** If Nextcloud AIO runs on the same host as this compose, use `http://host.docker.internal:9000` (or the host IP) as the S3 endpoint. If on another VM, use the internal hostname or IP and port (e.g. `http://minio-host:9000`).
3. **Configure Nextcloud:** After installation, use Nextcloud’s **Object Store** (primary storage) with:
   - bucket: `nextcloud`
   - endpoint: MinIO URL (e.g. `http://host.docker.internal:9000` or `http://<minio-host>:9000`)
   - access key / secret: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from the compose `.env`
   - path style: enable (MinIO uses path-style).

Official docs: [Configuring Object Storage as Primary Storage](https://docs.nextcloud.com/server/stable/admin_manual/installation/object_store_configuration.html). AIO does not preconfigure S3 from env; configure it once the instance is up (e.g. via `occ config:system:set` or Admin → Object Store).

## Resources

- **Minimum:** 4 GB RAM, 2 vCPU.
- **Recommended (with Collabora, Imaginary, etc.):** 8 GB+ RAM, 2 vCPU, 20–50 GB disk.

## References

- [Nextcloud AIO on GitHub](https://github.com/nextcloud/all-in-one)
- [Nextcloud AIO Docker Hub](https://hub.docker.com/r/nextcloud/all-in-one)
- [CHATGPT-MULTITENANT-APP-STACK](../../CHATGPT-MULTITENANT-APP-STACK.md) (file plane vs blob plane)
