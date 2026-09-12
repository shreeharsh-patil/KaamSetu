# ==============================================================================
# Stage 1: Base Alpine Image with pnpm & build tools
# ==============================================================================
FROM node:22-alpine AS base

# Install build dependencies for native compilation (e.g. bcrypt)
RUN apk add --no-cache libc6-compat python3 make g++

# Enable corepack and activate pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app

# ==============================================================================
# Stage 2: Dependencies & Build Stage
# ==============================================================================
FROM base AS builder

# Copy monorepo configuration and package descriptors
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/config/package.json ./packages/config/
COPY packages/logger/package.json ./packages/logger/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/

# Install full dependencies (including devDependencies for compilation)
RUN pnpm install --frozen-lockfile

# Copy source code and TypeScript configurations
COPY tsconfig.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Compile all workspace packages and apps
RUN pnpm build

# Prune devDependencies to keep runtime lightweight
RUN pnpm prune --prod

# ==============================================================================
# Stage 3: Production Express API Image (Default Target)
# ==============================================================================
FROM node:22-alpine AS api

# Install runtime utilities: dumb-init for PID 1 signal handling, wget for healthcheck
RUN apk add --no-cache dumb-init wget

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Copy production artifacts and dependency graphs from builder
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Enforce non-root execution for container security
RUN chown -R node:node /app
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/server.js"]

# ==============================================================================
# Stage 4: Production BullMQ Background Worker Image
# ==============================================================================
FROM node:22-alpine AS worker

# Install runtime utilities
RUN apk add --no-cache dumb-init wget

ENV NODE_ENV=production
ENV WORKER_HEALTH_PORT=5001

WORKDIR /app

# Copy production artifacts and dependency graphs from builder
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker ./apps/worker

# Enforce non-root execution for container security
RUN chown -R node:node /app
USER node

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/worker/dist/index.js"]
