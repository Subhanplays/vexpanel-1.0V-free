#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping VexPanel..."
docker compose down

echo "Remove volumes? (THIS WILL DELETE ALL DATA)"
read -p "Type 'yes' to confirm: " confirm
if [ "$confirm" = "yes" ]; then
  docker compose down -v
  echo "Volumes removed."
fi

echo "VexPanel stopped."
echo "To fully uninstall:"
echo "  rm -rf $SCRIPT_DIR"
echo "  docker system prune -f"
