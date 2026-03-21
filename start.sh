#!/bin/bash

set -e

echo "🚀 Starting TutorFlow..."

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установи Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Запускаем PostgreSQL
echo "📦 Starting PostgreSQL..."
docker-compose up -d postgres

# Ждём готовности базы данных
echo "⏳ Waiting for database..."
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Database ready"

# Применяем миграции
echo "🔄 Running migrations..."
cd apps/api
pnpm db:migrate
cd ../..

# Запускаем dev-серверы
echo "🎯 Starting dev servers..."
echo ""
echo "   API:  http://localhost:4000"
echo "   Web:  http://localhost:3000"
echo ""
pnpm dev
