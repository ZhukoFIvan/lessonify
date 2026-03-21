import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { requireAuth, requireTutor, requireStudent } from '../../middleware/auth'
import {
  createSlotSchema,
  updateSlotSchema,
  createBookingSchema,
  respondBookingSchema,
} from './availability.schemas'
import { availabilityService, NotFoundError, ForbiddenError, ConflictError } from './availability.service'

export const availabilityRouter = Router()

function handleError(res: Response, err: unknown): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten().fieldErrors })
    return
  }
  if (err instanceof NotFoundError) { res.status(404).json({ error: err.message }); return }
  if (err instanceof ForbiddenError) { res.status(403).json({ error: err.message }); return }
  if (err instanceof ConflictError) { res.status(409).json({ error: err.message }); return }
  console.error('[availability]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// ── Репетитор: слоты ─────────────────────────────────────────────────────────

availabilityRouter.get('/slots', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const slots = await availabilityService.listSlots(tutorId)
    res.json({ data: slots })
  } catch (err) { handleError(res, err) }
})

availabilityRouter.post('/slots', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = createSlotSchema.parse(req.body)
    const slot = await availabilityService.createSlot(tutorId, data)
    res.status(201).json({ data: slot })
  } catch (err) { handleError(res, err) }
})

availabilityRouter.patch('/slots/:id', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = updateSlotSchema.parse(req.body)
    const slot = await availabilityService.updateSlot(tutorId, req.params['id']!, data)
    res.json({ data: slot })
  } catch (err) { handleError(res, err) }
})

availabilityRouter.delete('/slots/:id', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    await availabilityService.deleteSlot(tutorId, req.params['id']!)
    res.status(204).send()
  } catch (err) { handleError(res, err) }
})

// ── Репетитор: запросы на запись ─────────────────────────────────────────────

availabilityRouter.get('/bookings', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const status = req.query['status'] as string | undefined
    const bookings = await availabilityService.listBookings(tutorId, status)
    res.json({ data: bookings })
  } catch (err) { handleError(res, err) }
})

availabilityRouter.patch(
  '/bookings/:id/respond',
  requireAuth,
  requireTutor,
  async (req: Request, res: Response) => {
    try {
      const tutorId = req.user!.tutorId!
      const data = respondBookingSchema.parse(req.body)
      const booking = await availabilityService.respondToBooking(tutorId, req.params['id']!, data)
      res.json({ data: booking })
    } catch (err) { handleError(res, err) }
  },
)

// ── Ученик: публичные слоты и записи ────────────────────────────────────────

availabilityRouter.get(
  '/tutor/:tutorId/slots',
  requireAuth,
  requireStudent,
  async (req: Request, res: Response) => {
    try {
      const slots = await availabilityService.getPublicSlots(req.params['tutorId']!)
      res.json({ data: slots })
    } catch (err) { handleError(res, err) }
  },
)

availabilityRouter.post('/bookings', requireAuth, requireStudent, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.studentId!
    const data = createBookingSchema.parse(req.body)
    const booking = await availabilityService.createBooking(studentId, data)
    res.status(201).json({ data: booking })
  } catch (err) { handleError(res, err) }
})

availabilityRouter.get('/bookings/my', requireAuth, requireStudent, async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.studentId!
    const bookings = await availabilityService.listMyBookings(studentId)
    res.json({ data: bookings })
  } catch (err) { handleError(res, err) }
})
