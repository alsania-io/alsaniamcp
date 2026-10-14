# Podman/Docker compatible build for AlsaniaMCP
# Build with: podman build -t alsaniamcp/mcp:latest .
# Or: docker build -t alsaniamcp/mcp:latest .

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Environment variables - compatible with both Podman and Docker
ENV PORT=5050
ENV NODE_ENV=production

EXPOSE 5050

# Health check - works with both Podman and Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5050/health || exit 1

CMD ["node", "dist/index.js"]
