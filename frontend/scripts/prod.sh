#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

stop_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti :"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "Stopping process on port ${port}..."
    kill -9 $pids 2>/dev/null || true
  fi
}

# Dev and prod both write to .next — must not run build while dev is active
stop_port 3000
stop_port 3001

sleep 1

echo "Cleaning build cache..."
rm -rf .next node_modules/.cache

echo "Building production bundle..."
next build

echo "Starting production server at http://localhost:3000"
next start -p 3000
