#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log() { echo -e "${GREEN}[vexpanel]${NC} $1"; }
warn() { echo -e "${YELLOW}[vexpanel]${NC} $1"; }
err() { echo -e "${RED}[vexpanel]${NC} $1" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

command -v docker >/dev/null 2>&1 || err "Docker is required. Install Docker first."
command -v docker compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 || err "Docker Compose v2 is required."

if [ ! -f .env ]; then
  log "Creating .env from .env.example..."
  cp .env.example .env
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)
  COOKIE_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)
  POSTGRES_PASSWORD=$(openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | base64)
  ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
  sed -i "s|replace-with-at-least-32-random-characters|$JWT_SECRET|g" .env
  sed -i "s|replace-with-a-long-random-password|$POSTGRES_PASSWORD|g" .env
  sed -i "s|replace-with-a-32-byte-base64-key|$ENCRYPTION_KEY|g" .env
  sed -i "s|COOKIE_SECRET=replace-with-at-least-32-random-characters|COOKIE_SECRET=$COOKIE_SECRET|g" .env
  log ".env created with random secrets"
else
  warn ".env already exists, skipping creation"
fi

log "Building and starting services..."
docker compose pull 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

log "Waiting for PostgreSQL..."
sleep 5
docker compose exec -T postgres pg_isready -U vexpanel -d vexpanel >/dev/null 2>&1 || sleep 5

log "Running database migrations..."
docker compose exec -T api npx prisma migrate deploy 2>/dev/null || true

log "Generating initial admin user..."
docker compose exec -T api node -e "
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
async function main() {
  const db = new PrismaClient();
  const existing = await db.user.findUnique({ where: { email: 'admin@vexpanel.local' } });
  if (!existing) {
    const hash = await argon2.hash('admin-password-change-me', { type: argon2.argon2id });
    await db.user.create({ data: { email: 'admin@vexpanel.local', username: 'admin', passwordHash: hash, role: 'SUPER_ADMIN' } });
    console.log('Admin user created: admin@vexpanel.local / admin-password-change-me');
  } else {
    console.log('Admin user already exists');
  }
  await db.\$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
" 2>/dev/null || warn "Could not create admin user automatically"

log "Installation complete!"
echo ""
log "Access VexPanel at: http://localhost:${PORT:-3000}"
log "Default admin: admin@vexpanel.local / admin-password-change-me"
log ""
warn "CHANGE THE DEFAULT PASSWORD IMMEDIATELY!"
