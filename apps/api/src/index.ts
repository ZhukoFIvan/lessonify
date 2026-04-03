import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'

import { authRouter } from './modules/auth/auth.router'
import { studentsRouter } from './modules/students/students.router'
import { lessonsRouter } from './modules/lessons/lessons.router'
import { paymentsRouter } from './modules/payments/payments.router'
import { homeworkRouter } from './modules/homework/homework.router'
import { telegramRouter } from './modules/telegram/telegram.router'
import { uploadRouter } from './modules/upload/upload.router'
import { lessonNotesRouter } from './modules/lesson-notes/lesson-notes.router'
import { availabilityRouter } from './modules/availability/availability.router'
import { calendarRouter } from './modules/calendar/calendar.router'
import { referralsRouter } from './modules/referrals/referrals.router'
import { adminRouter } from './modules/admin/admin.router'
import { promoRouter } from './modules/promo/promo.router'
import { billingRouter } from './modules/billing/billing.router'
import { bot } from './modules/telegram/telegram.bot'
import { startCronJobs } from './cron/reminders'

const app = express()
const PORT = process.env.PORT ?? 4000
const IS_PROD = process.env.NODE_ENV === 'production'

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/auth', authRouter)
app.use('/students', studentsRouter)
app.use('/lessons', lessonsRouter)
app.use('/payments', paymentsRouter)
app.use('/homework', homeworkRouter)
app.use('/telegram', telegramRouter)
app.use('/upload', uploadRouter)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
app.use('/lesson-notes', lessonNotesRouter)
app.use('/availability', availabilityRouter)
app.use('/calendar', calendarRouter)
app.use('/referrals', referralsRouter)
app.use('/admin', adminRouter)
app.use('/promo', promoRouter)
app.use('/billing', billingRouter)

// ── 404 ───────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// ── Global error handler ──────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[unhandled]', err)
  res.status(500).json({ error: 'Internal Server Error' })
})

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`[api] Running on http://localhost:${PORT}`)

  // Cron-задачи (напоминания, очистка токенов)
  if (process.env.TELEGRAM_BOT_TOKEN) {
    startCronJobs()

    if (IS_PROD && process.env.TELEGRAM_WEBHOOK_URL) {
      // Production: webhook
      await bot.telegram.setWebhook(`${process.env.TELEGRAM_WEBHOOK_URL}/telegram/webhook`)
      console.log('[telegram] Webhook set')
    } else {
      // Development: long polling
      bot.launch({ dropPendingUpdates: true })
      console.log('[telegram] Bot started (polling)')

      // Graceful stop
      process.once('SIGINT', () => bot.stop('SIGINT'))
      process.once('SIGTERM', () => bot.stop('SIGTERM'))
    }
  } else {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN not set — bot and cron disabled')
  }
})

export default app
