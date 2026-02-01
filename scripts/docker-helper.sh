#!/bin/bash

# ====================================
# InspireWallet Gateway - Docker Helper
# ====================================
# A unified helper script for common Docker operations
# Works on: macOS, Windows (Git Bash/WSL), Linux
#
# Usage: ./docker-helper.sh [command]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Functions
print_usage() {
    echo -e "${CYAN}InspireWallet Gateway - Docker Helper${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC} $0 [command]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  up              Start all services (development)"
    echo "  up:tools        Start all services with dev tools"
    echo "  up:prod         Start all services (production)"
    echo "  down            Stop all services"
    echo "  restart         Restart all services"
    echo "  logs [service]  View logs (default: app)"
    echo "  shell [service] Open shell in container (default: app)"
    echo "  db:migrate      Run database migrations"
    echo "  db:reset        Reset database (destructive!)"
    echo "  db:seed         Seed database with test data"
    echo "  db:studio       Open Prisma Studio"
    echo "  clean           Remove all containers and volumes"
    echo "  rebuild         Rebuild and restart containers"
    echo "  status          Show container status"
    echo "  health          Check service health"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 up                # Start development environment"
    echo "  $0 logs app          # View application logs"
    echo "  $0 shell postgres    # Open psql shell"
    echo ""
}

# Change to project directory
cd "$PROJECT_DIR"

# Commands
cmd_up() {
    echo -e "${GREEN}Starting development services...${NC}"
    docker compose up -d
    echo -e "${GREEN}Services started successfully!${NC}"
    cmd_status
}

cmd_up_tools() {
    echo -e "${GREEN}Starting development services with tools...${NC}"
    docker compose --profile tools up -d
    echo -e "${GREEN}Services started successfully!${NC}"
    cmd_status
}

cmd_up_prod() {
    echo -e "${GREEN}Starting production services...${NC}"
    docker compose -f docker-compose.prod.yml up -d
    echo -e "${GREEN}Production services started!${NC}"
}

cmd_down() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker compose down
    echo -e "${GREEN}Services stopped.${NC}"
}

cmd_restart() {
    echo -e "${YELLOW}Restarting services...${NC}"
    docker compose restart
    echo -e "${GREEN}Services restarted.${NC}"
}

cmd_logs() {
    local service=${1:-app}
    echo -e "${CYAN}Viewing logs for: $service${NC}"
    docker compose logs -f "$service"
}

cmd_shell() {
    local service=${1:-app}
    echo -e "${CYAN}Opening shell in: $service${NC}"
    
    case $service in
        postgres)
            docker compose exec postgres psql -U postgres -d inspirewallet
            ;;
        redis)
            docker compose exec redis redis-cli
            ;;
        *)
            docker compose exec "$service" sh
            ;;
    esac
}

cmd_db_migrate() {
    echo -e "${CYAN}Running database migrations...${NC}"
    pnpm prisma db push
    echo -e "${GREEN}Migrations complete.${NC}"
}

cmd_db_reset() {
    echo -e "${RED}WARNING: This will delete all data!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo -e "${YELLOW}Resetting database...${NC}"
        docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS inspirewallet;"
        docker compose exec postgres psql -U postgres -c "CREATE DATABASE inspirewallet;"
        pnpm prisma db push
        echo -e "${GREEN}Database reset complete.${NC}"
    else
        echo -e "${YELLOW}Cancelled.${NC}"
    fi
}

cmd_db_seed() {
    echo -e "${CYAN}Seeding database...${NC}"
    pnpm prisma db seed
    echo -e "${GREEN}Database seeded.${NC}"
}

cmd_db_studio() {
    echo -e "${CYAN}Opening Prisma Studio...${NC}"
    pnpm prisma studio
}

cmd_clean() {
    echo -e "${RED}WARNING: This will remove all containers and volumes!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo -e "${YELLOW}Cleaning up...${NC}"
        docker compose down -v --remove-orphans
        docker compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
        echo -e "${GREEN}Cleanup complete.${NC}"
    else
        echo -e "${YELLOW}Cancelled.${NC}"
    fi
}

cmd_rebuild() {
    echo -e "${CYAN}Rebuilding containers...${NC}"
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}Rebuild complete.${NC}"
    cmd_status
}

cmd_status() {
    echo -e "${CYAN}Container Status:${NC}"
    echo ""
    docker compose ps
}

cmd_health() {
    echo -e "${CYAN}Checking service health...${NC}"
    echo ""
    
    # Check app
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Application:${NC}  Healthy (http://localhost:3000)"
    else
        echo -e "${RED}✗ Application:${NC}  Not responding"
    fi
    
    # Check PostgreSQL
    if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL:${NC}   Healthy (localhost:5432)"
    else
        echo -e "${RED}✗ PostgreSQL:${NC}   Not responding"
    fi
    
    # Check Redis
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis:${NC}        Healthy (localhost:6379)"
    else
        echo -e "${RED}✗ Redis:${NC}        Not responding"
    fi
    
    echo ""
}

# Main
case "${1:-}" in
    up)
        cmd_up
        ;;
    up:tools)
        cmd_up_tools
        ;;
    up:prod)
        cmd_up_prod
        ;;
    down)
        cmd_down
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs "$2"
        ;;
    shell)
        cmd_shell "$2"
        ;;
    db:migrate)
        cmd_db_migrate
        ;;
    db:reset)
        cmd_db_reset
        ;;
    db:seed)
        cmd_db_seed
        ;;
    db:studio)
        cmd_db_studio
        ;;
    clean)
        cmd_clean
        ;;
    rebuild)
        cmd_rebuild
        ;;
    status)
        cmd_status
        ;;
    health)
        cmd_health
        ;;
    help|--help|-h|"")
        print_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        print_usage
        exit 1
        ;;
esac
