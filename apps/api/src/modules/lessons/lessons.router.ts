import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { requireAuth, requireTutor, requireStudent } from '../../middleware/auth'
import {
  createLessonSchema,
  updateLessonSchema,
  lessonsQuerySchema,
} from './lessons.schemas'
import { lessonsService } from './lessons.service'
import { NotFoundError, ForbiddenError } from '../students/students.service'

export const lessonsRouter = Router()

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
  if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message })
    return
  }
  console.error('[lessons]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// ── Ученик: только просмотр своего расписания ─────────────────────────────────
// ВАЖНО: /my должен быть ДО /:id — иначе Express матчит 'my' как :id

// GET /lessons/my
lessonsRouter.get('/my', requireAuth, requireStudent, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub!
    const query = lessonsQuerySchema.parse(req.query)
    const result = await lessonsService.listForStudent(userId, query)
    res.json(result)
  } catch (err) {
    handleError(res, err)
  }
})

// ── Репетитор: полный CRUD ────────────────────────────────────────────────────

// GET /lessons
lessonsRouter.get('/', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const query = lessonsQuerySchema.parse(req.query)
    const result = await lessonsService.list(tutorId, query)
    res.json(result)
  } catch (err) {
    handleError(res, err)
  }
})

// POST /lessons
lessonsRouter.post('/', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = createLessonSchema.parse(req.body)
    const result = await lessonsService.create(tutorId, data)
    res.status(201).json(result)
  } catch (err) {
    handleError(res, err)
  }
})

// GET /lessons/:id
lessonsRouter.get('/:id', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const lesson = await lessonsService.getById(tutorId, req.params['id']!)
    res.json({ data: lesson })
  } catch (err) {
    handleError(res, err)
  }
})

// PATCH /lessons/:id
lessonsRouter.patch('/:id', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = updateLessonSchema.parse(req.body)
    const lesson = await lessonsService.update(tutorId, req.params['id']!, data)
    res.json({ data: lesson })
  } catch (err) {
    handleError(res, err)
  }
})

// DELETE /lessons/:id
lessonsRouter.delete('/:id', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    await lessonsService.delete(tutorId, req.params['id']!)
    res.status(204).send()
  } catch (err) {
    handleError(res, err)
  }
})

// POST /lessons/:id/remind — отправить напоминание вручную
lessonsRouter.post('/:id/remind', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    await lessonsService.sendManualReminder(tutorId, req.params['id']!)
    res.json({ data: { message: 'Напоминание отправлено' } })
  } catch (err) {
    handleError(res, err)
  }
})

