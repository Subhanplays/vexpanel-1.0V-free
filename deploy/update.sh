#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "Updating VexPanel..."
git pull origin main 2>/dev/null || true

echo "Rebuilding containers..."
docker compose build --no-cache
docker compose up -d

echo "Running migrations..."
sleep 3
docker compose exec -T api npx prisma migrate deploy 2>/dev/null || true

echo "Restarting services..."
docker compose restart api

echo "Update complete!"
