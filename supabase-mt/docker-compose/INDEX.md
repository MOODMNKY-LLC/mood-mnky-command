# MOOD MNKY Docker Compose Stack

Production-ready Docker Compose configuration for deploying MOOD MNKY with Flowise AI, n8n Automation, PostgreSQL, and Redis.

## Files in This Directory

### Getting Started
- **README.md** - Complete setup and operation guide
- **QUICKSTART.md** - Quick reference for common commands
- **.env.example** - Environment variables template

### Deployment & Operations
- **PRODUCTION.md** - Production deployment guide for AWS, DigitalOcean, Azure
- **INTEGRATION.md** - How to integrate Docker stack with MOOD MNKY app
- **docker-compose.yml** - Main Docker Compose configuration
- **init.sh** - Automated setup script

## What's Included

This Docker Compose stack provides:

```
✓ PostgreSQL 15 (Database backend for all services)
✓ Redis 7 (Cache and queue management)
✓ Flowise AI (Visual AI workflow builder)
✓ n8n (Workflow automation platform)
✓ Built-in health checks and monitoring
✓ Persistent volumes for all data
✓ Production-ready configuration
```

## Quick Start

```bash
# 1. Setup environment
cp .env.example .env

# 2. Start services
./init.sh

# 3. Access services
# Flowise: http://localhost:3000
# n8n: http://localhost:5678
```

## Architecture

```
MOOD MNKY App (Vercel)
         ↓
    ┌────┴────┐
    ↓         ↓
 Flowise    n8n
    ├────┬────┤
    ↓    ↓    ↓
  PG  Redis  (shared)
```

## Key Features

### Multi-Service Orchestration
- All services communicate on shared network
- Automatic health checks and restarts
- Coordinated startup dependencies

### Data Persistence
- PostgreSQL database for Flowise and n8n
- Redis for caching and queues
- Named volumes prevent data loss

### Security
- Environment-based configuration
- Service isolation with Docker networks
- Support for SSL/TLS (production)

### Scalability
- Easily deployable to cloud platforms
- Load balancing ready
- Resource limits configurable

## Integration with MOOD MNKY App

The Docker stack integrates with the MOOD MNKY Next.js application via:

1. **Flowise API** - For AI chat interactions
2. **n8n API** - For workflow automation
3. **PostgreSQL** - For storing chat history and workflows
4. **Redis** - For caching and session management

See **INTEGRATION.md** for detailed API examples and configuration.

## Environment Variables

Key variables you should configure:

```bash
# PostgreSQL
POSTGRES_PASSWORD=<strong_password>

# Flowise
FLOWISE_PASSWORD=<strong_password>

# n8n
N8N_BASIC_AUTH_PASSWORD=<strong_password>

# Logging
LOG_LEVEL=info
```

See **.env.example** for complete list.

## Production Deployment

For deploying to production:

1. Read **PRODUCTION.md** for cloud-specific instructions
2. Configure SSL/TLS certificates
3. Set strong passwords
4. Enable backup strategies
5. Set up monitoring and alerts

Supported cloud platforms:
- AWS (EC2, RDS, ECS)
- DigitalOcean (Droplets)
- Azure (Container Instances)
- Any VPS with Docker support

## Troubleshooting

### Services won't start?
```bash
# Check logs
docker-compose logs postgres

# Verify ports are available
netstat -tuln | grep 3000
```

### Database connection issues?
```bash
# Verify PostgreSQL is healthy
docker-compose exec postgres pg_isready -U postgres
```

### Need to reset?
```bash
# Delete all data and restart
docker-compose down -v
docker-compose up -d
```

See **README.md** for comprehensive troubleshooting guide.

## Documentation Index

### User Guides
- [README.md](README.md) - Complete setup and operations
- [QUICKSTART.md](QUICKSTART.md) - Quick reference card
- [PRODUCTION.md](PRODUCTION.md) - Production deployment guide
- [INTEGRATION.md](INTEGRATION.md) - App integration guide

### Configuration
- [docker-compose.yml](docker-compose.yml) - Service definitions
- [.env.example](.env.example) - Environment template

### Automation
- [init.sh](init.sh) - Automated setup script

## Service Information

### PostgreSQL
- **Port**: 5432
- **Default User**: postgres
- **Version**: 15 (Alpine)
- **Data Volume**: postgres_data
- **Databases**: mood_mnky, flowise, n8n

### Redis
- **Port**: 6379
- **Version**: 7 (Alpine)
- **Data Volume**: redis_data
- **Authentication**: None (configure in production)

### Flowise AI
- **Port**: 3000
- **UI URL**: http://localhost:3000
- **API**: http://localhost:3000/api/v1
- **Default User**: admin
- **Default Password**: admin_password
- **Data Volume**: flowise_data

### n8n
- **Port**: 5678
- **UI URL**: http://localhost:5678
- **Default User**: admin
- **Default Password**: admin_password
- **Data Volume**: n8n_data

## Common Tasks

### View service logs
```bash
docker-compose logs -f flowise
```

### Access database
```bash
docker-compose exec postgres psql -U postgres -d mood_mnky
```

### Backup data
```bash
docker-compose exec -T postgres pg_dump -U postgres mood_mnky > backup.sql
```

### Create admin user in Flowise
```bash
# Access Flowise at http://localhost:3000 and use default credentials
# Change password immediately in Settings
```

### Create workflow in n8n
```bash
# Access n8n at http://localhost:5678 and use default credentials
# Create workflows and get webhook URLs
```

## Performance Tips

1. **Monitor resource usage**: `docker stats`
2. **Enable query logging**: Adjust `LOG_LEVEL` in .env
3. **Use indexes**: Add database indexes for frequently queried fields
4. **Cache aggressively**: Configure Redis TTLs appropriately
5. **Scale horizontally**: Deploy multiple instances with load balancer

## Support Resources

- **Flowise Docs**: https://docs.flowiseai.com/
- **n8n Docs**: https://docs.n8n.io/
- **Docker Docs**: https://docs.docker.com/compose/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/documentation

## Security Best Practices

1. ✓ Change all default passwords immediately
2. ✓ Use strong, unique passwords
3. ✓ Enable SSL/TLS for remote connections
4. ✓ Restrict network access with firewall
5. ✓ Regular backup and recovery testing
6. ✓ Monitor logs for suspicious activity
7. ✓ Keep Docker images updated
8. ✓ Use environment variables for secrets

## Version Information

- Docker Compose: v3.8+
- Docker: 20.10+
- PostgreSQL: 15
- Redis: 7
- Flowise: Latest
- n8n: Latest

## License

This Docker Compose configuration is part of MOOD MNKY and follows the project's license terms.

## Questions?

- Check relevant documentation file above
- Review logs: `docker-compose logs SERVICE_NAME`
- See troubleshooting sections in README.md
- Consult official service documentation

---

**Last Updated**: 2024
**Stack Version**: 1.0
**Status**: Production Ready
