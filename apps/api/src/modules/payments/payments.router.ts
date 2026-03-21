import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError } from 'zod'
import { requireAuth, requireTutor } from '../../middleware/auth'
import { payLessonSchema, summaryQuerySchema, debtQuerySchema, invoiceQuerySchema } from './payments.schemas'
import { paymentsService, BadRequestError } from './payments.service'
import { invoiceService } from './invoice.service'
import { NotFoundError, ForbiddenError } from '../students/students.service'

export const paymentsRouter = Router()

paymentsRouter.use(requireAuth, requireTutor)

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
  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message })
    return
  }
  console.error('[payments]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// ── PATCH /payments/lessons/:id/pay ──────────────────────────────────────────

paymentsRouter.patch('/lessons/:id/pay', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const data = payLessonSchema.parse(req.body)
    const lesson = await paymentsService.payLesson(tutorId, req.params['id']!, data)
    res.json({ data: lesson })
  } catch (err) {
    handleError(res, err)
  }
})

// ── PATCH /payments/lessons/:id/unpay ────────────────────────────────────────

paymentsRouter.patch('/lessons/:id/unpay', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    await paymentsService.unpayLesson(tutorId, req.params['id']!)
    res.json({ data: { message: 'Оплата отменена' } })
  } catch (err) {
    handleError(res, err)
  }
})

// ── PATCH /payments/students/:id/pay-all ─────────────────────────────────────

paymentsRouter.patch('/students/:id/pay-all', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const result = await paymentsService.payAllForStudent(tutorId, req.params['id']!)
    res.json({ data: result })
  } catch (err) {
    handleError(res, err)
  }
})

// ── GET /payments/summary ─────────────────────────────────────────────────────

paymentsRouter.get('/summary', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const query = summaryQuerySchema.parse(req.query)
    const result = await paymentsService.getSummary(tutorId, query)
    res.json({ data: result })
  } catch (err) {
    handleError(res, err)
  }
})

// ── GET /payments/invoice ────────────────────────────────────────────────────

paymentsRouter.get('/invoice', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const query = invoiceQuerySchema.parse(req.query)
    const pdfBytes = await invoiceService.generate(tutorId, query.studentId, query.from, query.to)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${query.studentId}-${query.from}.pdf"`)
    res.send(Buffer.from(pdfBytes))
  } catch (err) {
    handleError(res, err)
  }
})

// ── GET /payments/debt ────────────────────────────────────────────────────────

paymentsRouter.get('/debt', async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId!
    const query = debtQuerySchema.parse(req.query)
    const debtors = await paymentsService.getDebtors(tutorId, query)
    res.json({ data: debtors })
  } catch (err) {
    handleError(res, err)
  }
})
