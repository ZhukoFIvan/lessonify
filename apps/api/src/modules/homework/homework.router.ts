import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { requireAuth, requireTutor, requireStudent } from '../../middleware/auth'
import {
  createHomeworkSchema,
  updateHomeworkSchema,
  submitHomeworkSchema,
  homeworkQuerySchema,
} from './homework.schemas'
import { homeworkService, ConflictError } from './homework.service'
import { NotFoundError, ForbiddenError } from '../students/students.service'

export const homeworkRouter = Router()

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
  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message })
    return
  }
  console.error('[homework]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Репетитор
// ─────────────────────────────────────────────────────────────────────────────

// GET /homework — список актуальных ДЗ репетитора
homeworkRouter.get('/', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const query = homeworkQuerySchema.parse(req.query)
    const result = await homeworkService.listForTutor(tutorId, query)
    res.json(result)
  } catch (err) {
    handleError(res, err)
  }
})

// GET /homework/stats — счётчики для бейджей
homeworkRouter.get('/stats', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const stats = await homeworkService.getStats(tutorId)
    res.json({ data: stats })
  } catch (err) {
    handleError(res, err)
  }
})

// POST /homework/lessons/:lessonId — создать ДЗ к уроку
homeworkRouter.post(
  '/lessons/:lessonId',
  requireAuth,
  requireTutor,
  async (req: Request, res: Response) => {
    try {
      const tutorId = req.user!.tutorId!
      const data = createHomeworkSchema.parse(req.body)
      const hw = await homeworkService.create(tutorId, req.params['lessonId']!, data)
      res.status(201).json({ data: hw })
    } catch (err) {
      handleError(res, err)
    }
  },
)

// PATCH /homework/:id — обновить (репетитор: любое поле + feedback)
homeworkRouter.patch('/:id', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = updateHomeworkSchema.parse(req.body)
    const hw = await homeworkService.updateByTutor(tutorId, req.params['id']!, data)
    res.json({ data: hw })
  } catch (err) {
    handleError(res, err)
  }
})

// DELETE /homework/:id
homeworkRouter.delete('/:id', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    await homeworkService.delete(tutorId, req.params['id']!)
    res.status(204).send()
  } catch (err) {
    handleError(res, err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Ученик
// ─────────────────────────────────────────────────────────────────────────────

// GET /homework/my — свои ДЗ
homeworkRouter.get('/my', requireAuth, requireStudent, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub!
    const query = homeworkQuerySchema.parse(req.query)
    const result = await homeworkService.listForStudent(userId, query)
    res.json(result)
  } catch (err) {
    handleError(res, err)
  }
})

// PATCH /homework/:id/submit — сдать ДЗ (ученик)
homeworkRouter.patch(
  '/:id/submit',
  requireAuth,
  requireStudent,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.sub!
      const data = submitHomeworkSchema.parse(req.body)
      const hw = await homeworkService.submitByStudent(userId, req.params['id']!, data)
      res.json({ data: hw })
    } catch (err) {
      handleError(res, err)
    }
  },
)
