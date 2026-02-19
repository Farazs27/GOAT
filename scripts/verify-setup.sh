#!/bin/bash

set -e

echo "🔍 Nexiom Setup Verification"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

check_version() {
    if command -v $1 &> /dev/null; then
        version=$($2 2>&1 | head -n 1)
        echo -e "  Version: $version"
    fi
}

echo "1. Checking prerequisites..."
echo "-----------------------------"

# Check Node.js
if check_command "node"; then
    check_version "node" "node --version"
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "${YELLOW}⚠${NC}  Node.js version should be 20 or higher"
    fi
else
    echo "Please install Node.js 20 or higher: https://nodejs.org/"
    exit 1
fi

# Check pnpm
if check_command "pnpm"; then
    check_version "pnpm" "pnpm --version"
else
    echo -e "${YELLOW}⚠${NC}  pnpm not found. Installing..."
    npm install -g pnpm
fi

# Check Docker
if check_command "docker"; then
    check_version "docker" "docker --version"
else
    echo -e "${YELLOW}⚠${NC}  Docker not found. Please install Docker: https://docs.docker.com/get-docker/"
fi

# Check Docker Compose
if check_command "docker-compose"; then
    echo -e "${GREEN}✓${NC} Docker Compose is installed"
else
    echo -e "${YELLOW}⚠${NC}  Docker Compose not found"
fi

echo ""
echo "2. Checking project structure..."
echo "-----------------------------"

required_dirs=("apps/web" "apps/api" "packages/database" "packages/shared-types" "packages/crypto" "infrastructure/keycloak")

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir/ exists"
    else
        echo -e "${RED}✗${NC} $dir/ missing"
    fi
done

echo ""
echo "3. Checking configuration files..."
echo "-----------------------------"

required_files=("package.json" "turbo.json" "pnpm-workspace.yaml" "docker-compose.yml" ".env.example" "README.md")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

echo ""
echo "4. Checking environment..."
echo "-----------------------------"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
else
    echo -e "${YELLOW}⚠${NC}  .env.local not found (copy from .env.example)"
fi

echo ""
echo "================================"
echo "✅ Setup verification complete!"
echo ""
echo "Next steps:"
echo "  1. Run: docker-compose up -d"
echo "  2. Run: pnpm install"
echo "  3. Run: pnpm db:generate && pnpm db:migrate && pnpm db:seed"
echo "  4. Run: pnpm dev"
echo ""
echo "Then open:"
echo "  - Web App: http://localhost:3000"
echo "  - API: http://localhost:3001"
echo "  - API Docs: http://localhost:3001/api/docs"
echo "  - Keycloak: http://localhost:8080 (admin/admin)"
