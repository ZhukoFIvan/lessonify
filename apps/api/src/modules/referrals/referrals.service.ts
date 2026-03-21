import { prisma } from '../../lib/prisma'
import { bot } from '../telegram/telegram.bot'

const MIN_WITHDRAWAL = 500   // минимум 500 ₽
const COMMISSION_RATE = 0.20 // 20%

// ── Генерация реферального кода ───────────────────────────────────────────────

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ── Уведомление администратора через Telegram ─────────────────────────────────

async function notifyAdmin(params: {
  userName: string
  userEmail: string
  amount: number
  cardDetails: string
  requestId: string
}) {
  const adminId = process.env.ADMIN_TELEGRAM_ID
  if (!adminId || !process.env.TELEGRAM_BOT_TOKEN) return

  const text =
    `💰 Новая заявка на вывод средств\n\n` +
    `👤 Пользователь: ${params.userName}\n` +
    `📧 Email: ${params.userEmail}\n` +
    `💵 Сумма: ${params.amount} ₽\n` +
    `💳 Реквизиты: ${params.cardDetails}\n\n` +
    `🆔 Заявка: ${params.requestId}`

  try {
    await bot.telegram.sendMessage(adminId, text)
  } catch (err) {
    console.error('[referrals] Failed to notify admin:', err)
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const referralsService = {
  // Статистика текущего пользователя
  async getStats(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        referralCode: true,
        referrals: {
          select: { id: true, name: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const earnings = await prisma.referralEarning.findMany({
      where: { earnerId: userId },
      orderBy: { createdAt: 'desc' },
    })

    const totalEarned = earnings.reduce((sum, e) => sum + e.earnAmount, 0)
    const paidOut = earnings.filter((e) => e.paid).reduce((sum, e) => sum + e.earnAmount, 0)
    const availableBalance = totalEarned - paidOut

    // Есть ли незакрытая заявка за этот месяц
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const pendingRequest = await prisma.withdrawalRequest.findFirst({
      where: { userId, status: 'PENDING', createdAt: { gte: monthStart } },
    })

    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000'

    return {
      referralCode: user.referralCode,
      referralLink: user.referralCode ? `${webUrl}/register?ref=${user.referralCode}` : null,
      referralsCount: user.referrals.length,
      referrals: user.referrals,
      totalEarned,
      paidOut,
      availableBalance,
      earnings: earnings.map((e) => ({
        id: e.id,
        earnAmount: e.earnAmount,
        purchaseAmount: e.purchaseAmount,
        description: e.description,
        paid: e.paid,
        createdAt: e.createdAt,
      })),
      canWithdraw: availableBalance >= MIN_WITHDRAWAL && !pendingRequest,
      hasPendingRequest: !!pendingRequest,
      minWithdrawal: MIN_WITHDRAWAL,
    }
  },

  // Запрос на вывод
  async requestWithdrawal(userId: string, cardDetails: string) {
    const stats = await this.getStats(userId)

    if (stats.availableBalance < MIN_WITHDRAWAL) {
      const err = new Error(`Минимальная сумма вывода — ${MIN_WITHDRAWAL} ₽`)
      ;(err as any).statusCode = 400
      throw err
    }
    if (stats.hasPendingRequest) {
      const err = new Error('У вас уже есть заявка на вывод в этом месяце')
      ;(err as any).statusCode = 400
      throw err
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, email: true },
    })

    const request = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: stats.availableBalance,
        cardDetails,
        status: 'PENDING',
      },
    })

    await notifyAdmin({
      userName: user.name,
      userEmail: user.email,
      amount: request.amount,
      cardDetails: request.cardDetails,
      requestId: request.id,
    })

    return request
  },

  // Начислить комиссию (вызывается при покупке подписки)
  async recordPurchase(referredUserId: string, purchaseAmount: number, description?: string) {
    const user = await prisma.user.findUnique({
      where: { id: referredUserId },
      select: { referredById: true },
    })
    if (!user?.referredById) return null  // нет реферера — ничего не делаем

    const earnAmount = Math.round(purchaseAmount * COMMISSION_RATE)

    return prisma.referralEarning.create({
      data: {
        earnerId: user.referredById,
        referredId: referredUserId,
        purchaseAmount,
        earnAmount,
        description: description ?? `Покупка подписки ${purchaseAmount} ₽`,
      },
    })
  },

  // Отметить заявку оплаченной (ручной endpoint для admin)
  async markPaid(requestId: string) {
    const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id: requestId } })

    // Помечаем все unpaid earning'и как paid
    await prisma.referralEarning.updateMany({
      where: { earnerId: request.userId, paid: false },
      data: { paid: true },
    })

    return prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: { status: 'PAID', processedAt: new Date() },
    })
  },
}
