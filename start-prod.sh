#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Stopping old processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "Building frontend..."
cd "$ROOT/frontend"
rm -rf .next
npm run build

echo ""
echo "Starting production server on http://localhost:3000"
echo "Demo login: admin@test.com / password123"
echo ""
npm run start
