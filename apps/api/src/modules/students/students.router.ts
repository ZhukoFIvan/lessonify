import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { requireAuth, requireTutor, requireStudent } from '../../middleware/auth'
import { prisma } from '../../lib/prisma'
import {
  createStudentSchema,
  updateStudentSchema,
  studentsQuerySchema,
} from './students.schemas'
import { studentsService, NotFoundError, ForbiddenError } from './students.service'

export const studentsRouter = Router()

// ── GET /students/my-tutor — репетитор ученика (только ученик) ───────────────

studentsRouter.get('/my-tutor', requireAuth, requireStudent, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub
    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        tutor: {
          select: {
            id: true,
            subjects: true,
            hourlyRate: true,
            user: { select: { name: true, avatarUrl: true } },
            availabilitySlots: { where: { isActive: true }, orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }] },
          },
        },
      },
    })
    if (!student) { res.status(404).json({ error: 'Ученик не найден' }); return }
    res.json({ data: student.tutor })
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /students/accept-invite (доступен всем авторизованным) ───────────────

studentsRouter.post('/accept-invite', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub!
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Токен приглашения обязателен' })
    }

    const result = await studentsService.acceptInvite(userId, token)
    res.json({ data: result })
  } catch (err) {
    handleError(res, err)
  }
})

// Все остальные роуты требуют авторизованного репетитора
studentsRouter.use(requireAuth, requireTutor)

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
  console.error('[students]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// ── GET /students ─────────────────────────────────────────────────────────────

studentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const query = studentsQuerySchema.parse(req.query)
    const result = await studentsService.list(tutorId, query)
    res.json(result)
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /students ────────────────────────────────────────────────────────────

studentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = createStudentSchema.parse(req.body)
    const student = await studentsService.create(tutorId, data)
    res.status(201).json({ data: student })
  } catch (err) {
    handleError(res, err)
  }
})

// ── GET /students/:id ─────────────────────────────────────────────────────────

studentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const student = await studentsService.getById(tutorId, req.params['id']!)
    res.json({ data: student })
  } catch (err) {
    handleError(res, err)
  }
})

// ── PATCH /students/:id ───────────────────────────────────────────────────────

studentsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = updateStudentSchema.parse(req.body)
    const student = await studentsService.update(tutorId, req.params['id']!, data)
    res.json({ data: student })
  } catch (err) {
    handleError(res, err)
  }
})

// ── DELETE /students/:id ──────────────────────────────────────────────────────

studentsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    await studentsService.delete(tutorId, req.params['id']!)
    res.status(204).send()
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /students/:id/invite ─────────────────────────────────────────────────

studentsRouter.post('/:id/invite', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const inviteUrl = await studentsService.generateInvite(tutorId, req.params['id']!)
    res.json({ data: { inviteUrl } })
  } catch (err) {
    handleError(res, err)
  }
})
