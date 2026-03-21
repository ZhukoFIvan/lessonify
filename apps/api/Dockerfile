FROM node:20-alpine AS base
RUN npm install -g pnpm@9.4.0
RUN apk add --no-cache openssl

# ── Зависимости ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml .npmrc package.json ./
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# ── Сборка ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages packages
COPY packages packages
COPY apps/api apps/api
COPY tsconfig.base.json ./
# Prisma generate (нужен для @prisma/client)
# Prisma generate (нужен для @prisma/client)
RUN pnpm --filter @tutorflow/api exec prisma generate
# Packages/types и packages/utils — TS source, компилируются вместе с API
RUN pnpm --filter @tutorflow/api build

# ── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

# Копируем только нужное
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 4000
# migrate deploy автоматически применяет pending миграции
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
