import { prisma } from '../../lib/prisma'
import { buildPaymentUrl, verifySignature } from './prodamus'

const FRONTEND_URL = () => process.env.FRONTEND_URL ?? 'http://localhost:3000'
const FREE_STUDENT_LIMIT = 5

export class BillingError extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'BillingError'
    this.statusCode = statusCode
  }
}

type PlanPeriod = 'monthly' | 'yearly'

const PLAN_CONFIG: Record<PlanPeriod, { price: number; days: number; label: string }> = {
  monthly: { price: 499, days: 30, label: 'PRO на 1 месяц' },
  yearly: { price: 3990, days: 365, label: 'PRO на 1 год' },
}

export const billingService = {
  // ── Trial ───────────────────────────────────────────────────────────────────

  async activateTrial(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

    if (user.trialUsed) {
      throw new BillingError('Пробный период уже был использован')
    }
    if (user.plan === 'PRO') {
      throw new BillingError('У вас уже активен PRO-план')
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { plan: 'PRO', planExpiresAt: expiresAt, trialUsed: true },
    })

    return { plan: updated.plan, planExpiresAt: updated.planExpiresAt }
  },

  // ── Checkout ────────────────────────────────────────────────────────────────

  async createCheckout(userId: string, period: PlanPeriod) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    const config = PLAN_CONFIG[period]
    if (!config) throw new BillingError('Неизвестный тариф')

    const orderId = `pro_${userId}_${period}_${Date.now()}`

    const url = buildPaymentUrl({
      orderId,
      amount: config.price,
      productName: `Lessonify ${config.label}`,
      customerEmail: user.email,
      urlSuccess: `${FRONTEND_URL()}/settings?payment=success`,
      urlReturn: `${FRONTEND_URL()}/settings?payment=cancelled`,
    })

    // Prodamus returns the payment link in response
    const res = await fetch(url)
    const text = await res.text()

    let paymentUrl: string
    try {
      const json = JSON.parse(text)
      paymentUrl = json.payment_link ?? json.link ?? text.trim()
    } catch {
      paymentUrl = text.trim()
    }

    if (!paymentUrl.startsWith('http')) {
      console.error('[billing] Prodamus response:', text)
      throw new BillingError('Не удалось создать платёжную ссылку', 502)
    }

    return { url: paymentUrl, orderId }
  },

  // ── Webhook ─────────────────────────────────────────────────────────────────

  async handleWebhook(body: Record<string, unknown>, sign: string) {
    if (!verifySignature(body, sign)) {
      throw new BillingError('Неверная подпись', 403)
    }

    const paymentStatus = String(body.payment_status ?? '')
    if (paymentStatus !== 'success') {
      return { handled: false, reason: `status=${paymentStatus}` }
    }

    const orderId = String(body.order_id ?? '')
    const parts = orderId.split('_')
    if (parts[0] !== 'pro' || parts.length < 4) {
      return { handled: false, reason: 'not a billing order' }
    }

    const userId = parts[1]!
    const period = parts[2] as PlanPeriod
    const config = PLAN_CONFIG[period]
    if (!config) {
      return { handled: false, reason: `unknown period: ${period}` }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { handled: false, reason: `user not found: ${userId}` }
    }

    // Extend from current expiry if still active
    const base =
      user.plan === 'PRO' && user.planExpiresAt && user.planExpiresAt > new Date()
        ? user.planExpiresAt
        : new Date()

    const newExpiry = new Date(base)
    newExpiry.setDate(newExpiry.getDate() + config.days)

    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'PRO', planExpiresAt: newExpiry },
    })

    console.log(`[billing] PRO activated for ${userId}, expires ${newExpiry.toISOString()}`)
    return { handled: true, userId, plan: 'PRO', planExpiresAt: newExpiry }
  },

  // ── Student limit ───────────────────────────────────────────────────────────

  getStudentLimit(plan: string): number | null {
    return plan === 'FREE' ? FREE_STUDENT_LIMIT : null
  },

  async checkStudentLimit(tutorId: string): Promise<void> {
    const tutor = await prisma.tutor.findUniqueOrThrow({
      where: { id: tutorId },
      include: { user: { select: { plan: true } } },
    })

    const limit = billingService.getStudentLimit(tutor.user.plan)
    if (limit === null) return

    const count = await prisma.student.count({ where: { tutorId } })
    if (count >= limit) {
      throw new BillingError(
        `На бесплатном плане можно добавить до ${limit} учеников. Перейдите на PRO для снятия ограничения.`,
      )
    }
  },
}
