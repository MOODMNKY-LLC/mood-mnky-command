# MOOD MNKY Docker Stack - Production Deployment Guide

Complete guide for deploying the MOOD MNKY Docker Compose stack to production environments.

## Pre-Deployment Checklist

- [ ] All services tested locally with init.sh
- [ ] SSL/TLS certificates obtained
- [ ] Strong passwords generated for all services
- [ ] Backup strategy defined
- [ ] Monitoring and alerting configured
- [ ] Resource requirements validated
- [ ] Network security configured

## Cloud Platform Guides

### AWS Deployment

#### EC2 Instance Setup

1. **Launch EC2 Instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.medium (minimum for production)
   - Storage: 100GB EBS volume
   - Security Group: Allow ports 80, 443 (and SSH 22)

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker ubuntu
   ```

3. **Clone and Setup**
   ```bash
   git clone https://github.com/your-org/mood_mnky.git
   cd mood_mnky/docker-compose
   cp .env.example .env
   # Edit .env with production values
   ```

4. **Start Stack**
   ```bash
   sudo docker-compose up -d
   ```

#### AWS RDS Alternative (For Production Scale)

Instead of local PostgreSQL, use AWS RDS:

```env
# .env
DATABASE_TYPE=postgres
DATABASE_HOST=mood-mnky.c9akciq32.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=mood_mnky
DATABASE_USER=postgres
DATABASE_PASSWORD=<strong_password>
```

### DigitalOcean App Platform

1. **Create Droplet**
   - Image: Ubuntu 22.04 x64
   - Size: 4GB RAM / 2 vCPU
   - Region: Closest to users
   - Enable IPv6

2. **SSH and Setup**
   ```bash
   ssh root@your_droplet_ip
   curl -sSL https://get.docker.com | sh
   docker-compose --version
   ```

3. **Upload Stack**
   ```bash
   scp -r docker-compose root@your_droplet_ip:/root/
   ssh root@your_droplet_ip
   cd /root/docker-compose
   ```

4. **Configure and Deploy**
   ```bash
   cp .env.example .env
   nano .env  # Edit with production values
   docker-compose up -d
   ```

### Azure Container Instances

Use Azure Container Instances for serverless deployment:

```bash
# Create resource group
az group create --name mood-mnky --location eastus

# Create container group from docker-compose
az container create-from-yaml \
  --resource-group mood-mnky \
  --file docker-compose.yml
```

## SSL/TLS Configuration

### Using Let's Encrypt with Certbot

1. **Install Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Generate Certificate**
   ```bash
   sudo certbot certonly --standalone \
     -d flowise.yourdomain.com \
     -d n8n.yourdomain.com
   ```

3. **Configure Nginx**
   ```nginx
   upstream flowise {
       server localhost:3000;
   }

   upstream n8n {
       server localhost:5678;
   }

   server {
       listen 80;
       server_name flowise.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name flowise.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/flowise.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/flowise.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://flowise;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

   server {
       listen 443 ssl http2;
       server_name n8n.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/n8n.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/n8n.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://n8n;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Auto-Renew Certificates**
   ```bash
   sudo systemctl enable certbot.timer
   sudo systemctl start certbot.timer
   ```

## Production Environment Variables

Update `.env` with strong values:

```bash
# PostgreSQL - Use strong password
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Flowise
FLOWISE_PASSWORD=$(openssl rand -base64 32)

# n8n
N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 32)

# Log level
LOG_LEVEL=warn

# Security
DEBUG=false
```

## Backup & Recovery

### Automated Daily Backups

Create backup script `/opt/mood-mnky/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/mood_mnky"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump \
  -U postgres mood_mnky \
  > $BACKUP_DIR/mood_mnky_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/mood_mnky_$DATE.sql

# Backup volumes
docker run --rm \
  -v mood_mnky_flowise_data:/flowise_data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/flowise_$DATE.tar.gz -C /flowise_data .

# Backup n8n data
docker run --rm \
  -v mood_mnky_n8n_data:/n8n_data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/n8n_$DATE.tar.gz -C /n8n_data .

# Remove old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

### Setup Cron Job

```bash
# Add to crontab
0 2 * * * /opt/mood-mnky/backup.sh >> /var/log/mood-mnky-backup.log 2>&1
```

### Restore from Backup

```bash
# Restore PostgreSQL
gunzip -c /backups/mood_mnky/mood_mnky_20240101_020000.sql.gz | \
  docker-compose exec -T postgres psql -U postgres

# Restore Flowise
docker run --rm \
  -v mood_mnky_flowise_data:/flowise_data \
  -v /backups:/backup \
  alpine tar xzf /backup/flowise_20240101_020000.tar.gz -C /flowise_data

# Restore n8n
docker run --rm \
  -v mood_mnky_n8n_data:/n8n_data \
  -v /backups:/backup \
  alpine tar xzf /backup/n8n_20240101_020000.tar.gz -C /n8n_data
```

## Monitoring & Alerting

### Health Check Endpoint

Monitor services with a health check script:

```bash
#!/bin/bash

check_service() {
    local service=$1
    local port=$2
    local url="http://localhost:$port/health"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "$service: OK"
        return 0
    else
        echo "$service: FAILED (HTTP $response)"
        return 1
    fi
}

check_service "Flowise" 3000
check_service "n8n" 5678

# Check database connectivity
docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1 && \
    echo "PostgreSQL: OK" || echo "PostgreSQL: FAILED"

# Check Redis connectivity
docker-compose exec redis redis-cli ping > /dev/null 2>&1 && \
    echo "Redis: OK" || echo "Redis: FAILED"
```

### Prometheus Metrics (Optional)

Enable Prometheus metrics in services:

```env
# Flowise - export metrics
FLOWISE_PROMETHEUS_ENABLED=true

# n8n - export metrics
N8N_METRICS_ENABLED=true
```

## Scaling for High Traffic

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);

-- Analyze table statistics
ANALYZE;
```

### Redis Cluster (Optional)

For high-traffic scenarios, configure Redis Cluster:

```yaml
services:
  redis-cluster:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes
    # ... cluster configuration
```

### Load Balancing

Use Nginx upstream for load balancing:

```nginx
upstream flowise_backend {
    server flowise1:3000;
    server flowise2:3000;
    server flowise3:3000;
    least_conn;
}
```

## Security Hardening

### Update docker-compose.yml for Production

```yaml
services:
  postgres:
    environment:
      POSTGRES_INITDB_ARGS: "-c ssl=on -c ssl_cert_file=/etc/ssl/certs/server.crt -c ssl_key_file=/etc/ssl/private/server.key"
    volumes:
      - ./certs/server.crt:/etc/ssl/certs/server.crt:ro
      - ./certs/server.key:/etc/ssl/private/server.key:ro

  flowise:
    environment:
      DATABASE_SSL: "true"
    restart: unless-stopped

  n8n:
    environment:
      DB_POSTGRESDB_SSL: "true"
    restart: unless-stopped
```

### Firewall Configuration

```bash
# UFW - Ubuntu Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

## Troubleshooting Production Issues

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

### High CPU Usage

```bash
# Identify problematic service
docker stats

# Check logs for errors
docker-compose logs -f service_name

# Increase resource limits
# Edit docker-compose.yml and add:
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 4G
```

## Maintenance Windows

Schedule regular maintenance:

```bash
#!/bin/bash
# Weekly maintenance script

echo "Starting maintenance window..."

# Update images
docker-compose pull

# Stop services
docker-compose stop

# Backup database
./backup.sh

# Restart with new images
docker-compose up -d

# Verify services
sleep 30
docker-compose ps

echo "Maintenance completed"
```

## Support & Documentation

- Official Flowise Docs: https://docs.flowiseai.com/
- Official n8n Docs: https://docs.n8n.io/
- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL: https://www.postgresql.org/docs/
- Let's Encrypt: https://letsencrypt.org/

## Emergency Procedures

### Complete Stack Recovery

```bash
# 1. Stop everything
docker-compose stop

# 2. Restore latest backup
gunzip -c /backups/mood_mnky/latest.sql.gz | \
  docker-compose exec -T postgres psql -U postgres

# 3. Restart services
docker-compose up -d

# 4. Verify health
docker-compose ps
```

### Service Isolation Failure

```bash
# If a service is causing problems:
docker-compose stop problematic_service

# Investigate logs
docker-compose logs problematic_service

# Restart individually
docker-compose up -d problematic_service
```
