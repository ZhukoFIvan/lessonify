#!/bin/bash
set -e

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== Running DB migrations ==="
cd apps/api && ./node_modules/.bin/prisma migrate deploy && cd ../..

echo "=== Building web app ==="
# .env.local must NOT exist on production — it overrides all other env files
rm -f apps/web/.env.local
cd apps/web && NODE_OPTIONS="--max-old-space-size=1400" pnpm build && cd ../..

echo "=== Restarting services ==="
pm2 restart all

echo "=== Done ==="
pm2 list
