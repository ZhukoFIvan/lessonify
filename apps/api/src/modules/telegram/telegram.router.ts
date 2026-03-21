import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { requireAuth } from '../../middleware/auth'
import { telegramService } from './telegram.service'
import { NotFoundError } from '../students/students.service'
import { bot } from './telegram.bot'

export const telegramRouter = Router()

// ── Error handler ─────────────────────────────────────────────────────────────

function handleError(res: Response, err: unknown): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten().fieldErrors })
    return
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message })
    return
  }
  console.error('[telegram]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// ── GET /telegram/link — получить deep link для привязки ─────────────────────

telegramRouter.get('/link', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await telegramService.generateLink(req.user!)
    res.json({ data: result })
  } catch (err) {
    handleError(res, err)
  }
})

// ── GET /telegram/status — статус подключения ─────────────────────────────────

telegramRouter.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const status = await telegramService.getStatus(req.user!)
    res.json({ data: status })
  } catch (err) {
    handleError(res, err)
  }
})

// ── DELETE /telegram/disconnect ───────────────────────────────────────────────

telegramRouter.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  try {
    await telegramService.disconnect(req.user!)
    res.json({ data: { message: 'Telegram отключён' } })
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /telegram/webhook — webhook от Telegram ──────────────────────────────
// Используется в production (Railway). В dev — polling.

telegramRouter.post('/webhook', async (req: Request, res: Response) => {
  try {
    await bot.handleUpdate(req.body)
    res.sendStatus(200)
  } catch (err) {
    console.error('[telegram webhook]', err)
    res.sendStatus(500)
  }
})
