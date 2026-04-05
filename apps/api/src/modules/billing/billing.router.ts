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

// POST /billing/webhook — Robokassa callback (form-urlencoded, no JWT auth)
// Robokassa шлёт application/x-www-form-urlencoded
billingRouter.post(
  '/webhook',
  (req, res, next) => {
    // Принимаем form-urlencoded тело для этого роута
    // (глобально настроен только express.json)
    const contentType = req.headers['content-type'] ?? ''
    if (contentType.includes('urlencoded')) {
      // Читаем сырое тело и парсим вручную
      let raw = ''
      req.setEncoding('utf8')
      req.on('data', (chunk) => { raw += chunk })
      req.on('end', () => {
        const params: Record<string, string> = {}
        for (const pair of raw.split('&')) {
          const [k, v] = pair.split('=')
          if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
        }
        req.body = params
        next()
      })
    } else {
      next()
    }
  },
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, string>
      const result = await billingService.handleWebhook(body)
      // Robokassa требует ответ "OK<InvId>"
      res.status(200).send(`OK${body['InvId'] ?? ''}`)
    } catch (err: any) {
      console.error('[billing/webhook]', err.message)
      const status = err instanceof BillingError ? err.statusCode : 500
      res.status(status).send(err.message)
    }
  },
)

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
