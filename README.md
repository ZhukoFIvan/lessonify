# TutorFlow

PWA-сервис для репетиторов: расписание уроков, учёт оплат, домашние задания, Telegram-уведомления.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui |
| State | Zustand · React Hook Form · Zod |
| HTTP | Axios (JWT interceptors + refresh queue) |
| Auth | NextAuth.js (credentials + Google OAuth) |
| Backend | Node.js · Express · Prisma ORM |
| База данных | PostgreSQL |
| Bot | Telegraf (Telegram) |
| Cron | node-cron |
| PWA | next-pwa · Web Push |
| Monorepo | pnpm workspaces · Turborepo |

---

## Структура проекта

```
tutorhelp/
├── apps/
│   ├── api/          # Express backend (port 4000)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── types/        # Общие TypeScript-типы
│   └── utils/        # Общие утилиты (форматирование, даты)
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Быстрый старт (локальная разработка)

### 1. Требования

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm@9.4.0`)
- PostgreSQL 15+ (локально или через Docker)

### 2. Установка зависимостей

```bash
pnpm install
```

### 3. Переменные окружения

**`apps/api/.env`** (скопируй из `.env.example`):
```env
NODE_ENV=development
PORT=4000
WEB_URL=http://localhost:3000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tutorflow

JWT_ACCESS_SECRET=сгенерируй-случайную-строку-32+символа
JWT_REFRESH_SECRET=сгенерируй-другую-случайную-строку-32+символа
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# Опционально
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=tutorflow_bot
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@tutorflow.app
```

**`apps/web/.env.local`** (скопируй из `.env.local.example`):
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=любая-случайная-строка

NEXT_PUBLIC_API_URL=http://localhost:4000

# Опционально
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

> **Генерация случайных секретов:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. База данных

```bash
# Создаём базу и применяем миграции
cd apps/api
pnpm db:migrate

# Заполнить демо-данными (опционально)
pnpm db:seed
# Демо: tutor@tutorflow.dev / password123
```

### 5. Запуск

```bash
# Из корня — запускает api + web одновременно
pnpm dev

# Или по отдельности:
pnpm --filter @tutorflow/api dev    # http://localhost:4000
pnpm --filter @tutorflow/web dev    # http://localhost:3000
```

---

## Скрипты

| Команда | Описание |
|---------|---------|
| `pnpm dev` | Запуск всех сервисов в dev-режиме |
| `pnpm build` | Сборка всех пакетов |
| `pnpm typecheck` | Проверка типов во всём монорепо |
| `pnpm lint` | Линтинг |
| `pnpm format` | Форматирование через Prettier |
| `pnpm --filter @tutorflow/api db:migrate` | Применить миграции |
| `pnpm --filter @tutorflow/api db:seed` | Загрузить демо-данные |
| `pnpm --filter @tutorflow/api db:studio` | Открыть Prisma Studio |
| `pnpm --filter @tutorflow/api db:reset` | Сброс БД (dev only) |

---

## API роуты

Базовый URL (dev): `http://localhost:4000`

### Auth — `/auth`

| Метод | Путь | Авторизация | Описание |
|-------|------|------------|---------|
| POST | `/auth/register` | — | Регистрация (TUTOR или STUDENT с inviteToken) |
| POST | `/auth/login` | — | Вход по email + password |
| POST | `/auth/google` | — | Вход через Google (передаётся idToken) |
| POST | `/auth/refresh` | cookie `tf_refresh` | Ротация refresh-токена |
| POST | `/auth/logout` | cookie `tf_refresh` | Выход, инвалидация токена |
| GET | `/auth/me` | Bearer | Текущий пользователь |
| PATCH | `/auth/profile` | Bearer | Обновить имя / пол / аватар |
| GET | `/auth/tutor` | Bearer (TUTOR) | Настройки репетитора |
| PATCH | `/auth/tutor` | Bearer (TUTOR) | Обновить предметы / ставку / напоминания |

### Students — `/students` _(только TUTOR)_

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/students` | Список учеников (`?search=&page=&limit=`) |
| POST | `/students` | Создать ученика |
| GET | `/students/:id` | Карточка ученика с историей уроков |
| PATCH | `/students/:id` | Обновить данные |
| DELETE | `/students/:id` | Удалить (cascade: уроки, ДЗ) |
| POST | `/students/:id/invite` | Сгенерировать ссылку-приглашение |

### Lessons — `/lessons`

| Метод | Путь | Авторизация | Описание |
|-------|------|------------|---------|
| GET | `/lessons/my` | Bearer (STUDENT) | Уроки ученика (`?date=&from=&to=&status=`) |
| GET | `/lessons` | Bearer (TUTOR) | Уроки репетитора с фильтрами |
| POST | `/lessons` | Bearer (TUTOR) | Создать урок (поддержка `repeat`) |
| GET | `/lessons/:id` | Bearer (TUTOR) | Урок с ДЗ и платежом |
| PATCH | `/lessons/:id` | Bearer (TUTOR) | Обновить статус / время / цену |
| DELETE | `/lessons/:id` | Bearer (TUTOR) | Удалить урок |

### Payments — `/payments` _(только TUTOR)_

| Метод | Путь | Описание |
|-------|------|---------|
| PATCH | `/payments/lessons/:id/pay` | Отметить урок оплаченным |
| PATCH | `/payments/lessons/:id/unpay` | Отменить оплату |
| PATCH | `/payments/students/:id/pay-all` | Погасить весь долг ученика |
| GET | `/payments/summary` | Сводка за месяц + график (`?month=&months=`) |
| GET | `/payments/debt` | Список должников (`?minDebt=`) |

### Homework — `/homework`

| Метод | Путь | Авторизация | Описание |
|-------|------|------------|---------|
| GET | `/homework` | Bearer (TUTOR) | ДЗ репетитора (`?studentId=&status=&overdue=`) |
| GET | `/homework/stats` | Bearer (TUTOR) | Счётчики: assigned / submitted / overdue |
| GET | `/homework/my` | Bearer (STUDENT) | ДЗ ученика (`?status=`) |
| POST | `/homework/lessons/:lessonId` | Bearer (TUTOR) | Создать ДЗ к уроку |
| PATCH | `/homework/:id` | Bearer (TUTOR) | Обновить / добавить feedback |
| PATCH | `/homework/:id/submit` | Bearer (STUDENT) | Сдать ДЗ |
| DELETE | `/homework/:id` | Bearer (TUTOR) | Удалить ДЗ |

### Telegram — `/telegram`

| Метод | Путь | Авторизация | Описание |
|-------|------|------------|---------|
| GET | `/telegram/link` | Bearer | Получить deep link для привязки |
| GET | `/telegram/status` | Bearer | Статус подключения |
| DELETE | `/telegram/disconnect` | Bearer | Отвязать аккаунт |
| POST | `/telegram/webhook` | — | Webhook от Telegram (prod) |

### Health

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/health` | `{ status: "ok", timestamp }` |

---

## Frontend роуты

Базовый URL (dev): `http://localhost:3000`

### Публичные

| Путь | Описание |
|------|---------|
| `/` | Редирект → `/dashboard` (авториз.) или `/auth/login` |
| `/auth/login` | Страница входа |
| `/auth/register` | Регистрация (выбор роли) |
| `/onboarding` | Заполнение профиля после регистрации |
| `/invite/[token]` | Принять приглашение от репетитора |
| `/offline` | PWA offline-страница |

### Защищённые (требуют авторизации)

| Путь | Роль | Описание |
|------|------|---------|
| `/dashboard` | ALL | Дашборд (разный для TUTOR и STUDENT) |
| `/calendar` | ALL | Расписание уроков |
| `/students` | TUTOR | Список учеников |
| `/finances` | TUTOR | Финансы: сводка + график + должники |
| `/homework` | STUDENT | Домашние задания |
| `/settings` | ALL | Настройки профиля, Telegram, напоминания |

### Next.js API routes

| Путь | Описание |
|------|---------|
| `/api/auth/[...nextauth]` | NextAuth.js handler (все OAuth/credentials коллбэки) |

---

## Роли и права

| Действие | TUTOR | STUDENT |
|----------|-------|---------|
| Просмотр своих уроков | ✅ GET `/lessons` | ✅ GET `/lessons/my` |
| Создание/редактирование уроков | ✅ | ❌ |
| Управление учениками | ✅ | ❌ |
| Финансы и оплаты | ✅ | ❌ |
| Создание ДЗ | ✅ | ❌ |
| Просмотр / сдача ДЗ | ❌ | ✅ |
| Подключение Telegram | ✅ | ✅ |

---

## Деплой на Railway

### Структура сервисов

Создаёт 3 сервиса в Railway:

```
Project: tutorflow
├── api          ← apps/api/Dockerfile
├── web          ← apps/web/Dockerfile
└── postgres     ← Railway PostgreSQL plugin
```

### Шаги

1. **Создай проект на [railway.app](https://railway.app)**

2. **Добавь PostgreSQL** → `+ New` → `Database` → `PostgreSQL`

3. **Деплой API:**
   - `+ New` → `GitHub Repo` → выбери репозиторий
   - `Settings` → `Source` → `Root Directory` = `/` (корень)
   - `Settings` → `Build` → `Dockerfile Path` = `apps/api/Dockerfile`
   - Переменные окружения (см. ниже)

4. **Деплой Web:**
   - Аналогично, `Dockerfile Path` = `apps/web/Dockerfile`
   - Переменные окружения (см. ниже)

### Переменные окружения Railway

**API сервис:**
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
WEB_URL=https://your-web.up.railway.app
JWT_ACCESS_SECRET=<random 64 chars>
JWT_REFRESH_SECRET=<random 64 chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=tutorflow_bot
TELEGRAM_WEBHOOK_URL=https://your-api.up.railway.app
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:admin@tutorflow.app
```

**Web сервис:**
```
NEXTAUTH_URL=https://your-web.up.railway.app
NEXTAUTH_SECRET=<random 64 chars>
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
```

> `DATABASE_URL` автоматически подставляется из Railway PostgreSQL через `${{Postgres.DATABASE_URL}}`

### Генерация VAPID ключей (для Web Push)

```bash
cd apps/api
npx web-push generate-vapid-keys
```

---

## Модели данных (Prisma)

```
User          – базовый аккаунт (email, name, avatarUrl, role)
Tutor         – профиль репетитора (subjects, hourlyRate, reminders)
Student       – ученик репетитора (subject, hourlyRate, color, inviteToken)
Lesson        – урок (startTime, duration, status, paymentStatus, price)
Payment       – запись оплаты (lessonId, amount, paidAt)
Homework      – домашнее задание (description, deadline, status, feedback)
TelegramConnection – привязка Telegram-аккаунта
RefreshToken  – хранение SHA-256 хеша refresh-токена
PushSubscription   – Web Push подписка
CalendarSync  – синхронизация с Google Calendar
```

---

## Telegram бот

Бот поддерживает deep-link привязку:
- Репетитор: `/start tutor_<code>`
- Ученик: `/start student_<code>`

**Dev режим:** автоматически запускается long polling при наличии `TELEGRAM_BOT_TOKEN`
**Prod режим:** устанавливает webhook на `TELEGRAM_WEBHOOK_URL/telegram/webhook`

**Cron-задачи** (если `TELEGRAM_BOT_TOKEN` задан):
- Каждую минуту: напоминания за 1ч и 24ч до урока, напоминания об оплате
- В 03:00 ежедневно: пометка просроченных уроков, очистка старых токенов
