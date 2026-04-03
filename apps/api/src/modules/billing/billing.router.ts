import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireTutor } from '../../middleware/auth'
import { billingService, BillingError } from './billing.service'
import { prisma } from '../../lib/prisma'
import type { Request, Response } from 'express'

export const billingRouter = Router()

// POST /billing/trial
billingRouter.post('/trial', requireAuth, requireTutor, async (req: Request, res: Response) => {
  try {
    const result = await billingService.activateTrial(req.user!.sub)
    res.json(result)
  } catch (err: any) {
    const status = err instanceof BillingError ? err.statusCode : 500
    res.status(status).json({ error: err.message })
  }
})

// POST /billing/checkout
const checkoutSchema = z.object({
  period: z.enum(['monthly', 'yearly']),
})

billingRouter.post('/checkout', requireAuth, requireTutor, async (req: Request, res: Response) => {
  const parsed = checkoutSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Укажите период: monthly или yearly' })
    return
  }

  try {
    const result = await billingService.createCheckout(req.user!.sub, parsed.data.period)
    res.json(result)
  } catch (err: any) {
    const status = err instanceof BillingError ? err.statusCode : 500
    res.status(status).json({ error: err.message })
  }
})

// POST /billing/webhook — Prodamus callback (verified by HMAC, no JWT auth)
billingRouter.post('/webhook', async (req: Request, res: Response) => {
  const sign = (req.headers['sign'] as string) ?? ''
  if (!sign) {
    res.status(400).json({ error: 'Missing Sign header' })
    return
  }

  try {
    const result = await billingService.handleWebhook(req.body, sign)
    res.status(200).json(result)
  } catch (err: any) {
    console.error('[billing/webhook]', err.message)
    const status = err instanceof BillingError ? err.statusCode : 500
    res.status(status).json({ error: err.message })
  }
})

// GET /billing/status
billingRouter.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.sub },
      select: { plan: true, planExpiresAt: true, trialUsed: true },
    })
    res.json(user)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
