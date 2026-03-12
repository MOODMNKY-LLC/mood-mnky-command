#!/bin/bash

# MOOD MNKY Docker Compose Setup Script
# This script initializes the Docker Compose stack for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  MOOD MNKY Docker Compose Stack Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Setting up .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    echo -e "${YELLOW}  Review .env and update values as needed${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check available ports
check_port() {
    if nc -z localhost $1 2>/dev/null; then
        echo -e "${YELLOW}⚠ Port $1 is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Port $1 is available${NC}"
        return 0
    fi
}

echo -e "\n${YELLOW}Checking required ports...${NC}"
PORT_ISSUES=0

check_port 3000 || PORT_ISSUES=1  # Flowise
check_port 5432 || PORT_ISSUES=1  # PostgreSQL
check_port 5678 || PORT_ISSUES=1  # n8n
check_port 6379 || PORT_ISSUES=1  # Redis
check_port 9000 || PORT_ISSUES=1  # MinIO API
check_port 9001 || PORT_ISSUES=1  # MinIO Console

if [ $PORT_ISSUES -eq 1 ]; then
    echo -e "${YELLOW}⚠ Some ports are in use. Set MINIO_API_PORT / MINIO_CONSOLE_PORT in .env (e.g. 9002, 9003) or modify docker-compose.yml${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Pull latest images
echo -e "\n${YELLOW}Pulling latest Docker images...${NC}"
docker-compose pull

# Start the stack
echo -e "\n${YELLOW}Starting Docker Compose stack...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service status
echo -e "\n${YELLOW}Checking service status...${NC}"
docker-compose ps

# Display access information
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Services are ready!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Service Access URLs:${NC}"
echo -e "  Flowise:     ${YELLOW}http://localhost:3000${NC}"
echo -e "  n8n:         ${YELLOW}http://localhost:5678${NC}"
echo -e "  PostgreSQL:  ${YELLOW}localhost:5432${NC}"
echo -e "  Redis:       ${YELLOW}localhost:6379${NC}"
echo ""
echo -e "${GREEN}Default Credentials:${NC}"
echo -e "  Flowise:     admin / admin_password"
echo -e "  n8n:         admin / admin_password"
echo -e "  PostgreSQL:  postgres / postgres_password"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Change default passwords immediately"
echo "  2. Review .env for custom configurations"
echo "  3. Check docker-compose/README.md for detailed documentation"
echo "  4. Set up your first Flowise workflow or n8n workflow"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:       docker-compose logs -f [service]"
echo "  Stop services:   docker-compose down"
echo "  Restart:         docker-compose restart"
echo "  Database shell:  docker-compose exec postgres psql -U postgres"
echo ""
