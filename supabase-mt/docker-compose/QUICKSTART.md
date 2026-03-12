# Docker Compose Stack - Quick Reference

## Quick Start

```bash
cd docker-compose
cp .env.example .env
# Optional: ./scripts/start-local.sh  (after supabase start --workdir supabase-mt)
# Optional: ./scripts/validate-env.sh
./init.sh
```

## Service URLs

| Service | URL | Auth |
|---------|-----|------|
| Flowise | http://localhost:3000 | admin / admin_password |
| n8n | http://localhost:5678 | admin / admin_password |
| PostgreSQL | localhost:5432 | postgres / postgres_password |
| Redis | localhost:6379 | No auth |

## Common Commands

```bash
# View logs
docker-compose logs -f [service]

# Restart services
docker-compose restart

# Stop all
docker-compose down

# Full reset (deletes data)
docker-compose down -v

# Database shell
docker-compose exec postgres psql -U postgres -d mood_mnky

# Redis CLI
docker-compose exec redis redis-cli

# View container stats
docker stats

# Backup database
docker-compose exec -T postgres pg_dump -U postgres mood_mnky > backup.sql
```

## Environment Variables

All environment variables are in `.env`:

- `POSTGRES_PASSWORD` - PostgreSQL password
- `FLOWISE_PASSWORD` - Flowise admin password
- `N8N_BASIC_AUTH_PASSWORD` - n8n admin password
- `LOG_LEVEL` - info, warn, error, debug

## Service Details

### PostgreSQL
- **Database**: mood_mnky
- **User**: postgres
- **Port**: 5432
- **Storage**: /var/lib/postgresql/data

### Flowise
- **UI**: http://localhost:3000
- **API**: http://localhost:3000/api/v1
- **Storage**: /root/.flowise
- **Config**: Environment variables

### n8n
- **UI**: http://localhost:5678
- **API**: http://localhost:5678/api/v1
- **Storage**: /home/node/.n8n
- **Webhooks**: Automatically generated

### Redis
- **Port**: 6379
- **Protocol**: Default (no auth)
- **Storage**: /data

## Troubleshooting

**Ports in use?**
```bash
lsof -i :3000  # Check port 3000
```

**Services won't start?**
```bash
docker-compose logs postgres  # Check logs
docker-compose ps              # Check status
```

**Database connection issues?**
```bash
docker-compose exec postgres pg_isready -U postgres
```

**Want fresh start?**
```bash
docker-compose down -v
docker-compose up -d
```

## Production Links

- Full Deployment Guide: PRODUCTION.md
- Integration with App: INTEGRATION.md
- Complete Setup: README.md

## Next Steps

1. Change default passwords in .env
2. Set up Flowise chatflows (visit http://localhost:3000)
3. Create n8n workflows (visit http://localhost:5678)
4. Connect to your app using environment variables
5. Read INTEGRATION.md for API details
