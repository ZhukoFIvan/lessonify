import { prisma } from '../../lib/prisma'
import { buildPaymentUrl, verifyWebhook, type WebhookResult } from './robokassa'

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

    // InvId должен быть числом; используем timestamp чтобы быть уникальным
    const invId = Math.floor(Date.now() / 1000) % 2000000000

    const url = buildPaymentUrl({
      amount: config.price,
      invId,
      description: `Lessonify ${config.label}`,
      email: user.email,
      userId,
      period,
      successUrl: `${FRONTEND_URL()}/settings?payment=success`,
      failUrl: `${FRONTEND_URL()}/settings?payment=cancelled`,
    })

    return { url, orderId: String(invId) }
  },

  // ── Webhook ─────────────────────────────────────────────────────────────────

  async handleWebhook(body: Record<string, string>): Promise<WebhookResult & { handled: boolean; planExpiresAt?: Date }> {
    const result = verifyWebhook(body)

    if (!result.valid) {
      throw new BillingError('Неверная подпись', 403)
    }

    const { userId, period } = result
    const config = PLAN_CONFIG[period as PlanPeriod]
    if (!config) {
      return { ...result, handled: false }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { ...result, handled: false }
    }

    // Продлеваем от текущей даты истечения если PRO ещё активен
    const base =
      user.plan === 'PRO' && user.planExpiresAt && user.planExpiresAt > new Date()
        ? user.planExpiresAt
        : new Date()

    const planExpiresAt = new Date(base)
    planExpiresAt.setDate(planExpiresAt.getDate() + config.days)

    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'PRO', planExpiresAt },
    })

    console.log(`[billing] PRO activated for ${userId}, expires ${planExpiresAt.toISOString()}`)
    return { ...result, handled: true, planExpiresAt }
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
