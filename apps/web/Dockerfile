# ─── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@8.15.0

COPY . .

RUN pnpm install --ignore-scripts

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

# ─── Stage 2: Production ─────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 cineverse
RUN adduser --system --uid 1001 web

COPY --from=builder --chown=web:cineverse /app/apps/web/.next/standalone ./
COPY --from=builder --chown=web:cineverse /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=web:cineverse /app/apps/web/public ./public

USER web

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
