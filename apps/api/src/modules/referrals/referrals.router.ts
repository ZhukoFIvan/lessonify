import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middleware/auth'
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

// POST /referrals/record-purchase — начислить комиссию (вызывается при покупке Pro)
// В будущем будет вызываться автоматически из payment webhook
const purchaseSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
})

referralsRouter.post('/record-purchase', requireAuth, async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message })
    return
  }

  try {
    const earning = await referralsService.recordPurchase(
      parsed.data.userId,
      parsed.data.amount,
      parsed.data.description,
    )
    res.json({ earning })
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ error: err.message })
  }
})

// PATCH /referrals/withdraw/:id/paid — пометить заявку оплаченной (для admin)
referralsRouter.patch('/withdraw/:id/paid', requireAuth, async (req, res) => {
  try {
    const result = await referralsService.markPaid(req.params.id!)
    res.json(result)
  } catch (err: any) {
    res.status(err.statusCode ?? 500).json({ error: err.message })
  }
})
