import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth, requireTutor } from '../../middleware/auth'
import { calendarService } from './calendar.service'

export const calendarRouter = Router()

// GET /calendar/auth-url — получить URL для OAuth (репетитор)
calendarRouter.get('/auth-url', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const url = calendarService.getAuthUrl(tutorId)
    res.json({ data: { url } })
  } catch (err) {
    console.error('[calendar]', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// GET /calendar/callback — OAuth callback от Google (без auth)
calendarRouter.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state: tutorId } = req.query as { code: string; state: string }
    if (!code || !tutorId) {
      res.status(400).send('Неверный запрос')
      return
    }

    await calendarService.handleCallback(code, tutorId)

    const webUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
    res.redirect(`${webUrl}/settings?calendarConnected=1`)
  } catch (err) {
    console.error('[calendar/callback]', err)
    const webUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'
    res.redirect(`${webUrl}/settings?calendarError=1`)
  }
})

// GET /calendar/status — статус подключения
calendarRouter.get('/status', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const status = await calendarService.getStatus(tutorId)
    res.json({ data: status })
  } catch (err) {
    console.error('[calendar]', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// PATCH /calendar/sync-toggle — включить/выключить синхронизацию
calendarRouter.patch('/sync-toggle', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const syncEnabled = await calendarService.toggleSync(tutorId)
    res.json({ data: { syncEnabled } })
  } catch (err) {
    console.error('[calendar]', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// DELETE /calendar/disconnect — отключить Google Calendar
calendarRouter.delete('/disconnect', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    await calendarService.disconnect(tutorId)
    res.json({ data: { message: 'Google Calendar отключён' } })
  } catch (err) {
    console.error('[calendar]', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// POST /calendar/sync-all — синхронизировать все будущие уроки
calendarRouter.post('/sync-all', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const count = await calendarService.syncAll(tutorId)
    res.json({ data: { synced: count } })
  } catch (err) {
    console.error('[calendar]', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
