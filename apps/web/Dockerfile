FROM node:20-alpine AS base
RUN npm install -g pnpm@9.4.0

# ── Зависимости ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml .npmrc package.json ./
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# ── Сборка ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages packages
COPY apps/web apps/web
COPY tsconfig.base.json ./
# packages/* — TS source, транспилируются Next.js через transpilePackages
RUN pnpm --filter @tutorflow/web build

# ── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
