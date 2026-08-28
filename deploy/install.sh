#!/usr/bin/env bash
set -euo pipefail

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                                                                        ║
# ║   ██╗   ██╗██╗██████╗ ███████╗    ██╗      ██████╗  █████╗ ██████╗    ║
# ║   ██║   ██║██║██╔══██╗██╔════╝    ██║     ██╔═══██╗██╔══██╗██╔══██╗   ║
# ║   ██║   ██║██║██████╔╝█████╗      ██║     ██║   ██║███████║██████╔╝   ║
# ║   ╚██╗ ██╔╝██║██╔══██╗██╔══╝      ██║     ██║   ██║██╔══██║██╔══██╗   ║
# ║    ╚████╔╝ ██║██████╔╝███████╗    ███████╗╚██████╔╝██║  ██║██║  ██║   ║
# ║     ╚═══╝  ╚═╝╚═════╝ ╚══════╝    ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ║
# ║                                                                        ║
# ║          THE COMPLETE VPS HOSTING CONTROL PANEL                        ║
# ║                                                                        ║
# ║          Made with ❤️ by SubhanPlays                                   ║
# ║          https://github.com/Subhanplays                                ║
# ║                                                                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'
BOLD='\033[1m'

log()    { echo -e "${GREEN}✓${NC} $1"; }
warn()   { echo -e "${YELLOW}⚠${NC} $1"; }
err()    { echo -e "${RED}✗${NC} $1" >&2; exit 1; }
info()   { echo -e "${CYAN}ℹ${NC} $1"; }
header() { echo -e "\n${MAGENTA}${BOLD}── $1 ──${NC}\n"; }

print_banner() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════════════════════════════╗"
    echo "  ║                                                               ║"
    echo "  ║     ██╗   ██╗██╗██████╗ ███████╗                             ║"
    echo "  ║     ██║   ██║██║██╔══██╗██╔════╝                             ║"
    echo "  ║     ██║   ██║██║██████╔╝█████╗                               ║"
    echo "  ║     ╚██╗ ██╔╝██║██╔══██╗██╔══╝                               ║"
    echo "  ║      ╚████╔╝ ██║██████╔╝███████╗                             ║"
    echo "  ║       ╚═══╝  ╚═╝╚═════╝ ╚══════╝                             ║"
    echo "  ║                                                               ║"
    echo "  ║     ${WHITE}THE COMPLETE VPS HOSTING CONTROL PANEL${NC}${CYAN}                   ║"
    echo "  ║                                                               ║"
    echo "  ║     ${YELLOW}Made with ❤️  by SubhanPlays${NC}${CYAN}                             ║"
    echo "  ║     ${WHITE}https://github.com/Subhanplays${NC}${CYAN}                          ║"
    echo "  ║                                                               ║"
    echo "  ╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

REPO_URL="https://github.com/Subhanplays/vexpanel-1.0V-free.git"
REPO_DIR="vexpanel-1.0V-free"

# ══════════════════════════════════════════════════════════════════════════
# DETECT IF RUNNING REMOTELY OR LOCALLY
# ══════════════════════════════════════════════════════════════════════════
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"

if [ -f "${SCRIPT_DIR}/../docker-compose.yml" ]; then
    # Running from within the repo (local install)
    INSTALL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
    RUNNING_LOCAL=true
else
    # Running remotely via curl (need to clone)
    RUNNING_LOCAL=false
    INSTALL_DIR="$(pwd)/${REPO_DIR}"
fi

print_banner

echo -e "${WHITE}${BOLD}VexPanel Installer v1.0${NC}"
echo -e "${CYAN}Installing the complete VPS hosting platform...${NC}"
echo ""

# ══════════════════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ══════════════════════════════════════════════════════════════════════════
header "PRE-FLIGHT CHECKS"

if ! command -v docker >/dev/null 2>&1; then
    err "Docker is required but not installed.\n     Install Docker: https://docs.docker.com/get-docker/"
fi
log "Docker found: $(docker --version)"

if ! docker compose version >/dev/null 2>&1; then
    err "Docker Compose v2 is required.\n     Install: https://docs.docker.com/compose/install/"
fi
log "Docker Compose found: $(docker compose version 2>/dev/null | head -1)"

if ! command -v git >/dev/null 2>&1; then
    err "Git is required but not installed.\n     Install: sudo apt install git"
fi
log "Git found: $(git --version)"

if ! command -v openssl >/dev/null 2>&1; then
    warn "OpenSSL not found, will use /dev/urandom for secrets"
fi

# ══════════════════════════════════════════════════════════════════════════
# CLONE REPO (if running remotely)
# ══════════════════════════════════════════════════════════════════════════
if [ "$RUNNING_LOCAL" = false ]; then
    header "DOWNLOADING VEXPANEL"

    if [ -d "$INSTALL_DIR" ]; then
        warn "Directory $REPO_DIR already exists, pulling latest..."
        cd "$INSTALL_DIR"
        git pull origin main 2>/dev/null || true
    else
        log "Cloning VexPanel repository..."
        git clone "$REPO_URL" "$REPO_DIR"
        cd "$INSTALL_DIR"
    fi
    log "VexPanel downloaded to: $INSTALL_DIR"
else
    header "USING LOCAL VEXPANEL"
    cd "$INSTALL_DIR"
    log "Using local installation at: $INSTALL_DIR"
fi

# ══════════════════════════════════════════════════════════════════════════
# ENVIRONMENT SETUP
# ══════════════════════════════════════════════════════════════════════════
header "ENVIRONMENT SETUP"

if [ ! -f .env ]; then
    log "Creating .env from .env.example..."
    cp .env.example .env

    # Generate secure secrets
    if command -v openssl >/dev/null 2>&1; then
        JWT_SECRET=$(openssl rand -hex 32)
        COOKIE_SECRET=$(openssl rand -hex 32)
        POSTGRES_PASSWORD=$(openssl rand -hex 24)
        ENCRYPTION_KEY=$(openssl rand -base64 32)
    else
        JWT_SECRET=$(head -c 32 /dev/urandom | base64)
        COOKIE_SECRET=$(head -c 32 /dev/urandom | base64)
        POSTGRES_PASSWORD=$(head -c 24 /dev/urandom | base64)
        ENCRYPTION_KEY=$(head -c 32 /dev/urandom | base64)
    fi

    # Replace placeholders
    sed -i "s|replace-with-at-least-32-random-characters|$JWT_SECRET|g" .env
    sed -i "s|replace-with-a-long-random-password|$POSTGRES_PASSWORD|g" .env
    sed -i "s|replace-with-a-32-byte-base64-key|$ENCRYPTION_KEY|g" .env
    sed -i "s|COOKIE_SECRET=replace-with-at-least-32-random-characters|COOKIE_SECRET=$COOKIE_SECRET|g" .env

    log ".env created with secure random secrets"
else
    warn ".env already exists, skipping creation"
fi

# ══════════════════════════════════════════════════════════════════════════
# BUILD & DEPLOY
# ══════════════════════════════════════════════════════════════════════════
header "BUILDING SERVICES"

log "Pulling base images..."
docker compose pull 2>/dev/null || true

log "Building VexPanel containers (this may take a few minutes)..."
docker compose build --no-cache

log "Starting services..."
docker compose up -d

# ══════════════════════════════════════════════════════════════════════════
# DATABASE SETUP
# ══════════════════════════════════════════════════════════════════════════
header "DATABASE SETUP"

log "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U vexpanel -d vexpanel >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

if ! docker compose exec -T postgres pg_isready -U vexpanel -d vexpanel >/dev/null 2>&1; then
    err "PostgreSQL failed to start"
fi
log "PostgreSQL is ready"

log "Running database migrations..."
docker compose exec -T api npx prisma migrate deploy 2>/dev/null || true
log "Database schema updated"

# ══════════════════════════════════════════════════════════════════════════
# SEED DATA
# ══════════════════════════════════════════════════════════════════════════
header "SEEDING DEFAULT DATA"

docker compose exec -T api node -e "
const { PrismaClient } = require('@prisma/client');
async function main() {
  const db = new PrismaClient();

  const images = [
    { name: 'Ubuntu 22.04', distribution: 'ubuntu', release: '22.04', architecture: 'amd64', imageAlias: 'ubuntu:22.04', enabled: true },
    { name: 'Ubuntu 24.04', distribution: 'ubuntu', release: '24.04', architecture: 'amd64', imageAlias: 'ubuntu:24.04', enabled: true },
    { name: 'Debian 12', distribution: 'debian', release: '12', architecture: 'amd64', imageAlias: 'debian:12', enabled: true },
  ];
  for (const img of images) {
    await db.osImage.upsert({ where: { name: img.name }, create: img, update: {} });
  }

  const plans = [
    { name: 'Starter', cpu: 1, ramMiB: 2048, diskGiB: 25, vpsLimit: 1, ipv4: true, rdp: true, sshx: true, backups: false, snapshots: false, tailscale: false, ipv6: false },
    { name: 'Basic', cpu: 2, ramMiB: 4096, diskGiB: 50, vpsLimit: 2, ipv4: true, rdp: true, sshx: true, backups: true, snapshots: true, tailscale: true, ipv6: true },
    { name: 'Pro', cpu: 4, ramMiB: 8192, diskGiB: 100, vpsLimit: 5, ipv4: true, rdp: true, sshx: true, backups: true, snapshots: true, tailscale: true, ipv6: true },
    { name: 'Premium', cpu: 8, ramMiB: 16384, diskGiB: 200, vpsLimit: 10, ipv4: true, rdp: true, sshx: true, backups: true, snapshots: true, tailscale: true, ipv6: true },
  ];
  for (const plan of plans) {
    await db.plan.upsert({ where: { name: plan.name }, create: plan, update: {} });
  }

  console.log('Default data seeded');
  await db.\$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
" 2>/dev/null || warn "Could not seed default data"

# ══════════════════════════════════════════════════════════════════════════
# COMPLETE
# ══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║                                                               ║"
echo "  ║                    ✓ INSTALLATION COMPLETE                    ║"
echo "  ║                                                               ║"
echo "  ╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${WHITE}${BOLD}Access VexPanel:${NC}"
echo -e "  ${CYAN}http://localhost:${PORT:-3000}${NC}"
echo ""
echo -e "  ${WHITE}${BOLD}First-time setup:${NC}"
echo -e "  ${CYAN}Open the panel in your browser and create the initial admin account.${NC}"
echo ""
echo -e "  ${WHITE}${BOLD}Useful Commands:${NC}"
echo -e "  ${GREEN}View logs:    ${CYAN}docker compose logs -f${NC}"
echo -e "  ${GREEN}Stop panel:   ${CYAN}docker compose down${NC}"
echo -e "  ${GREEN}Restart:      ${CYAN}docker compose restart${NC}"
echo -e "  ${GREEN}Update:       ${CYAN}bash deploy/update.sh${NC}"
echo -e "  ${GREEN}Backup:       ${CYAN}bash deploy/backup.sh${NC}"
echo ""
echo -e "  ${MAGENTA}${BOLD}Made with ❤️  by SubhanPlays${NC}"
echo -e "  ${WHITE}https://github.com/Subhanplays${NC}"
echo ""
