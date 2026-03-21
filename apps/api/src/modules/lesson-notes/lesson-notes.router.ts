import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { requireAuth, requireTutor } from '../../middleware/auth'
import { createNoteSchema, updateNoteSchema } from './lesson-notes.schemas'
import { lessonNotesService, NotFoundError, ForbiddenError } from './lesson-notes.service'

export const lessonNotesRouter = Router()

function handleError(res: Response, err: unknown): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten().fieldErrors })
    return
  }
  if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return }
  if (err instanceof ForbiddenError) { res.status(403).json({ error: err.message }); return }
  console.error('[lesson-notes]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// POST /lesson-notes/lessons/:lessonId — создать заметку (репетитор)
lessonNotesRouter.post(
  '/lessons/:lessonId',
  requireAuth,
  requireTutor,
  async (req: Request, res: Response) => {
    try {
      const tutorId = req.user!.tutorId!
      const data = createNoteSchema.parse(req.body)
      const note = await lessonNotesService.create(tutorId, req.params['lessonId']!, data)
      res.status(201).json({ data: note })
    } catch (err) { handleError(res, err) }
  },
)

// GET /lesson-notes/lessons/:lessonId — список заметок (репетитор или ученик)
lessonNotesRouter.get(
  '/lessons/:lessonId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const role = req.user!.role
      // Для репетитора requesterId = userId (проверяем через tutorId)
      // Для ученика requesterId = userId напрямую
      const requesterId = role === 'TUTOR' ? req.user!.tutorId! : req.user!.sub
      const notes = await lessonNotesService.listForLesson(
        req.params['lessonId']!,
        requesterId,
        role,
      )
      res.json({ data: notes })
    } catch (err) { handleError(res, err) }
  },
)

// PATCH /lesson-notes/:id — обновить заметку (репетитор)
lessonNotesRouter.patch(
  '/:id',
  requireAuth,
  requireTutor,
  async (req: Request, res: Response) => {
    try {
      const tutorId = req.user!.tutorId!
      const data = updateNoteSchema.parse(req.body)
      const note = await lessonNotesService.update(tutorId, req.params['id']!, data)
      res.json({ data: note })
    } catch (err) { handleError(res, err) }
  },
)

// DELETE /lesson-notes/:id — удалить заметку (репетитор)
lessonNotesRouter.delete(
  '/:id',
  requireAuth,
  requireTutor,
  async (req: Request, res: Response) => {
    try {
      const tutorId = req.user!.tutorId!
      await lessonNotesService.delete(tutorId, req.params['id']!)
      res.status(204).send()
    } catch (err) { handleError(res, err) }
  },
)
