# ==============================================================================
# Production Dockerfile for KaamSetu Express API (Repository Root Context)
# Multi-stage build with non-root execution and healthcheck
# ==============================================================================
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.21.0 --activate
WORKDIR /app

FROM base AS builder
ENV CI=true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/packages/config/package.json ./backend/packages/config/
COPY backend/packages/logger/package.json ./backend/packages/logger/
COPY backend/packages/types/package.json ./backend/packages/types/
COPY backend/packages/validation/package.json ./backend/packages/validation/
COPY backend/apps/api/package.json ./backend/apps/api/
COPY backend/apps/worker/package.json ./backend/apps/worker/

RUN pnpm install --frozen-lockfile

COPY backend/tsconfig.base.json ./backend/tsconfig.base.json
COPY backend/packages/ ./backend/packages/
COPY backend/apps/ ./backend/apps/

RUN pnpm --filter "@kaamsetu/*" build
RUN pnpm config set confirmModulesPurge false && CI=true pnpm prune --prod

FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init wget

ENV NODE_ENV=production
ENV PORT=10000

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend

RUN chown -R node:node /app
USER node

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:10000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/apps/api/dist/server.js"]
