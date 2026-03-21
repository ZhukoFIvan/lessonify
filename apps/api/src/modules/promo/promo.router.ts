import { Router } from 'express'
import type { Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth'
import { applyPromoCode, validatePromoCode } from './promo.service'

export const promoRouter = Router()

// POST /promo/apply
promoRouter.post('/apply', requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.body as { code: string }
    if (!code) { res.status(400).json({ error: 'Укажите промокод' }); return }
    const result = await applyPromoCode(req.user!.id, code)
    res.json({ data: result })
  } catch (e: any) {
    res.status(e.statusCode ?? 500).json({ error: e.message })
  }
})

// GET /promo/validate/:code
promoRouter.get('/validate/:code', requireAuth, async (req: Request, res: Response) => {
  const result = await validatePromoCode(req.params.code!, req.user!.id)
  res.json({ data: result })
})
