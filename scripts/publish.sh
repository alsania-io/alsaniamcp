#!/usr/bin/env bash
#!/bin/bash
source ~/.nvm/nvm.sh
export NODE_OPTIONS="--no-warnings"

set -e

# === COLORS ===
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting AlsaniaMCP Publish Pipeline...${NC}"

# === STEP 1: Clean up ===
echo -e "${YELLOW}🧹 Cleaning build and npm cache...${NC}"
rm -rf dist .local .replit replit.md node_modules
npm cache verify

# === STEP 2: Build ===
echo -e "${YELLOW}⚙️  Building project (TypeScript -> dist)...${NC}"
npm run build || { echo -e "${RED}❌ Build failed.${NC}"; exit 1; } 
echo -e "${CYAN}✅ Build complete.${NC}"

# === STEP 3: Verify package.json ===
if [ ! -f package.json ]; then
  echo -e "${RED}❌ package.json not found. Run from project root.${NC}"
  exit 1
fi
echo -e "${CYAN}✅ package.json detected.${NC}"

# === STEP 4: Version bump ===
echo -e "${YELLOW}🔢 Bumping patch version...${NC}"
npm version patch --no-git-tag-version

# === STEP 5: Sanity check ===
echo -e "${YELLOW}🔍 Running sanity check...${NC}"
npm pack --dry-run

# === STEP 6: Publish ===
echo -e "${GREEN}📦 Publishing to npm (public access)...${NC}"
npm publish --access public || {
  echo -e "${RED}❌ Publish failed.${NC}"
  exit 1
}

# === STEP 7: Confirmation ===
LATEST=$(npm view @alsania-io/mcp version)
echo -e "${GREEN}✅ Publish complete! Version now at: ${LATEST}${NC}"
echo -e "${CYAN}🌐 View on npm: https://www.npmjs.com/package/@alsania-io/mcp${NC}"
