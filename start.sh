#!/bin/bash

# ============================================================
# AI Telecom Customer Experience Manager - Start Script
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   AI Telecom Customer Experience Manager             ║${NC}"
echo -e "${PURPLE}║   Starting Application...                            ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============================================================
# Clean up used ports
# ============================================================
echo -e "${YELLOW}→ Cleaning up ports ${BACKEND_PORT} and ${FRONTEND_PORT}...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti:$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo -e "${GREEN}✓ Ports cleaned${NC}"

# ============================================================
# Check PostgreSQL
# ============================================================
echo -e "${YELLOW}→ Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}✗ PostgreSQL not found! Please install it.${NC}"
  exit 1
fi

# Start PostgreSQL if not running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

if pg_isready -q 2>/dev/null; then
  echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
  echo -e "${RED}✗ PostgreSQL is not running. Please start it manually.${NC}"
  exit 1
fi

# ============================================================
# Create database and user
# ============================================================
echo -e "${YELLOW}→ Setting up database...${NC}"

# Create user if not exists
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='telecom_user'" | grep -q 1 || \
  psql postgres -c "CREATE ROLE telecom_user WITH LOGIN PASSWORD 'telecom_pass' CREATEDB;" 2>/dev/null || true

# Create database if not exists
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='telecom_cx'" | grep -q 1 || \
  psql postgres -c "CREATE DATABASE telecom_cx OWNER telecom_user;" 2>/dev/null || true

# Grant privileges
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE telecom_cx TO telecom_user;" 2>/dev/null || true

echo -e "${GREEN}✓ Database ready${NC}"

# ============================================================
# Install dependencies
# ============================================================
echo -e "${YELLOW}→ Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${YELLOW}→ Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# ============================================================
# Seed database
# ============================================================
echo -e "${YELLOW}→ Seeding database...${NC}"
cd "$SCRIPT_DIR/backend/seeds"
node seed.js
echo -e "${GREEN}✓ Database seeded${NC}"

# ============================================================
# Start backend with nodemon (hot reload)
# ============================================================
echo -e "${YELLOW}→ Starting backend on port ${BACKEND_PORT} (with hot reload)...${NC}"
cd "$SCRIPT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# ============================================================
# Start frontend (Create React App has built-in hot reload)
# ============================================================
echo -e "${YELLOW}→ Starting frontend on port ${FRONTEND_PORT} (with hot reload)...${NC}"
cd "$SCRIPT_DIR/frontend"
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Application Started Successfully!                  ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║   Frontend:  http://localhost:${FRONTEND_PORT}                   ║${NC}"
echo -e "${CYAN}║   Backend:   http://localhost:${BACKEND_PORT}/api               ║${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║   Login Credentials:                                 ║${NC}"
echo -e "${CYAN}║   Email:    admin@telecom.com                        ║${NC}"
echo -e "${CYAN}║   Password: admin123                                 ║${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║   Press Ctrl+C to stop all services                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}→ Shutting down services...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
