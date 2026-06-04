import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '../../middleware/auth'
import { referralsService } from './referrals.service'

export const referralsRouter = Router()

// GET /referrals/stats — текущая статистика юзера
referralsRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await referralsService.getStats(req.user!.sub)
    res.json(stats)
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ error: err.message })
  }
})

// POST /referrals/withdraw — запрос на вывод
const withdrawSchema = z.object({
  cardDetails: z.string().min(5, 'Укажите реквизиты для перевода').max(200),
})

referralsRouter.post('/withdraw', requireAuth, async (req, res) => {
  const parsed = withdrawSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? 'Validation error' })
    return
  }

  try {
    const request = await referralsService.requestWithdrawal(req.user!.sub, parsed.data.cardDetails)
    res.json(request)
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ error: err.message })
  }
})

// Начисление реферальной комиссии происходит внутри сервера:
// referralsService.recordPurchase(userId, amount, description?) вызывает
// платёжный вебхук / promo-сервис. Публичного HTTP-роута для этого НЕТ —
// иначе любой авторизованный юзер мог бы начислить себе доход.

// PATCH /referrals/withdraw/:id/paid — пометить заявку оплаченной (только ADMIN)
referralsRouter.patch('/withdraw/:id/paid', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await referralsService.markPaid(req.params.id!)
    res.json(result)
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ error: err.message })
  }
})
