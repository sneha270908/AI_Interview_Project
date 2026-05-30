#!/bin/bash
set -e

echo "🚀 Setting up HireAI Interview System..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js v18+ is required. Please install from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js v18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Copy env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env from .env.example — fill in your API keys"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install worker dependencies
echo "📦 Installing worker dependencies..."
cd workers && npm install && cd ..

# Seed database (if MongoDB is running)
echo "🌱 Attempting to seed database..."
if (cd backend && npm run seed); then
  echo "✅ Database seeded"
else
  echo "⚠️  Seed skipped — start MongoDB first: docker-compose up mongodb -d"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "=== Quick Start ==="
echo "Option 1 (Docker):  docker-compose up --build"
echo "Option 2 (Manual):"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Open: http://localhost:3000"
echo "Login: admin@test.com / password123"
