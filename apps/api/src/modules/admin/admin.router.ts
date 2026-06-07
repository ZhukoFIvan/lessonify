import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '../../middleware/auth'
import { adminService } from './admin.service'
import { createPromoCode, getAllPromoCodes, togglePromoCode, adminApplyPro } from '../promo/promo.service'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

// GET /admin/stats
adminRouter.get('/stats', async (_req, res) => {
  try {
    res.json(await adminService.getStats())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /admin/users
adminRouter.get('/users', async (req, res) => {
  try {
    const { search, role, page = '1' } = req.query as Record<string, string>
    res.json(await adminService.getUsers({ search, role, page: Number(page) }))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /admin/users/:id
adminRouter.get('/users/:id', async (req, res) => {
  try {
    res.json(await adminService.getUserById(req.params.id!))
  } catch (err: any) {
    res.status(404).json({ error: 'User not found' })
  }
})

// PATCH /admin/users/:id/block
adminRouter.patch('/users/:id/block', async (req, res) => {
  try {
    res.json(await adminService.toggleBlock(req.params.id!))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /admin/users/:id/plan
const planSchema = z.object({
  plan: z.enum(['FREE', 'PRO']),
  months: z.number().int().min(1).max(24).optional(),
  days: z.number().int().min(1).max(1095).optional(), // до 3 лет точным числом дней
})

adminRouter.patch('/users/:id/plan', async (req, res) => {
  const parsed = planSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid data' }); return }
  try {
    res.json(await adminService.setPlan(req.params.id!, parsed.data.plan, parsed.data.months, parsed.data.days))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /admin/users/:id/role — назначить роль (в т.ч. ADMIN)
const roleSchema = z.object({ role: z.enum(['TUTOR', 'STUDENT', 'ADMIN']) })

adminRouter.patch('/users/:id/role', async (req, res) => {
  const parsed = roleSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid role' }); return }
  // Защита от самоблокировки: нельзя снять с себя права администратора
  if (req.params.id === req.user?.sub && parsed.data.role !== 'ADMIN') {
    res.status(400).json({ error: 'Нельзя снять права администратора с самого себя' })
    return
  }
  try {
    res.json(await adminService.setRole(req.params.id!, parsed.data.role))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /admin/withdrawals
adminRouter.get('/withdrawals', async (req, res) => {
  try {
    const { status, page = '1' } = req.query as Record<string, string>
    res.json(await adminService.getWithdrawals({ status, page: Number(page) }))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /admin/withdrawals/:id/process
adminRouter.patch('/withdrawals/:id/process', async (req, res) => {
  const { action, adminNote } = req.body
  if (!['PAID', 'REJECTED'].includes(action)) {
    res.status(400).json({ error: 'action must be PAID or REJECTED' })
    return
  }
  try {
    res.json(await adminService.processWithdrawal(req.params.id!, action, adminNote))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Заказы / платежи (Robokassa) ──────────────────────────────────────────────

// GET /admin/orders
adminRouter.get('/orders', async (req, res) => {
  try {
    const { status, page = '1' } = req.query as Record<string, string>
    res.json(await adminService.getOrders({ status, page: Number(page) }))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Статистика Telegram-бота ──────────────────────────────────────────────────

// GET /admin/bot-stats
adminRouter.get('/bot-stats', async (_req, res) => {
  try {
    res.json(await adminService.getBotStats())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ── Репетиторы → ученики ──────────────────────────────────────────────────────

// GET /admin/tutors
adminRouter.get('/tutors', async (req, res) => {
  try {
    const { search, page = '1' } = req.query as Record<string, string>
    res.json(await adminService.getTutors({ search, page: Number(page) }))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /admin/tutors/:id
adminRouter.get('/tutors/:id', async (req, res) => {
  try {
    res.json(await adminService.getTutorById(req.params.id!))
  } catch (err: any) {
    res.status(404).json({ error: 'Tutor not found' })
  }
})

// ── Промокоды ─────────────────────────────────────────────────────────────────

// GET /admin/promo
adminRouter.get('/promo', async (_req, res) => {
  try { res.json(await getAllPromoCodes()) }
  catch (err: any) { res.status(500).json({ error: err.message }) }
})

// POST /admin/promo
adminRouter.post('/promo', async (req, res) => {
  try {
    const { code, description, daysToAdd, maxUses, expiresAt } = req.body
    if (!code || !daysToAdd) { res.status(400).json({ error: 'code и daysToAdd обязательны' }); return }
    const promo = await createPromoCode({
      code, description, daysToAdd: Number(daysToAdd),
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    })
    res.json(promo)
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// PATCH /admin/promo/:id/toggle
adminRouter.patch('/promo/:id/toggle', async (req, res) => {
  try {
    const { isActive } = req.body
    res.json(await togglePromoCode(req.params.id!, Boolean(isActive)))
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// POST /admin/users/:id/apply-pro
adminRouter.post('/users/:id/apply-pro', async (req, res) => {
  try {
    const { days = 30 } = req.body
    res.json(await adminApplyPro(req.params.id!, Number(days)))
  } catch (err: any) { res.status(500).json({ error: err.message }) }
})
