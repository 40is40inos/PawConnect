# syntax=docker/dockerfile:1
# One image with the API and the built React app, served from the same origin.

# 1. Build the React app
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# No inline runtime script, so the Content-Security-Policy can forbid inline scripts.
ENV INLINE_RUNTIME_CHUNK=false GENERATE_SOURCEMAP=false
RUN npm run build

# 2. Production dependencies for the API
FROM node:22-alpine AS backend-deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# 3. Runtime image
FROM node:22-alpine
ENV NODE_ENV=production PORT=5000 FRONTEND_DIR=/app/public
WORKDIR /app
COPY --from=backend-deps /app/node_modules ./node_modules
COPY backend/ ./
COPY --from=frontend /frontend/build ./public
# Don't run as root.
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
# Migrations run automatically when the server starts.
CMD ["node", "server.js"]
