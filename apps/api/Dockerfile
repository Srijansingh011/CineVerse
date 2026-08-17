# ─── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@8.15.0

COPY . .

RUN pnpm install --ignore-scripts

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build API
RUN pnpm --filter api build

# ─── Stage 2: Production ─────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 cineverse
RUN adduser --system --uid 1001 api

COPY --from=builder --chown=api:cineverse /app /app

USER api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
