import { prisma } from '../../lib/prisma'

export class PromoError extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

// Применить промокод к пользователю
export async function applyPromoCode(userId: string, code: string) {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase().trim() } })

  if (!promo || !promo.isActive) throw new PromoError('Промокод не найден или неактивен')
  if (promo.expiresAt && promo.expiresAt < new Date()) throw new PromoError('Промокод истёк')
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new PromoError('Промокод уже использован максимальное количество раз')

  // Проверка что пользователь ещё не использовал этот код
  const alreadyUsed = await prisma.promoCodeUse.findUnique({
    where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
  })
  if (alreadyUsed) throw new PromoError('Вы уже использовали этот промокод')

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  // Считаем новую дату окончания плана
  const base = user.plan === 'PRO' && user.planExpiresAt && user.planExpiresAt > new Date()
    ? user.planExpiresAt
    : new Date()
  const newExpiry = new Date(base)
  newExpiry.setDate(newExpiry.getDate() + promo.daysToAdd)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { plan: 'PRO', planExpiresAt: newExpiry },
    }),
    prisma.promoCodeUse.create({
      data: { promoCodeId: promo.id, userId },
    }),
    prisma.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } },
    }),
  ])

  // Начислить реферальный бонус если пользователь был приглашён
  if (user.referredById) {
    const proPrice = 499 // условная стоимость Pro
    await prisma.referralEarning.create({
      data: {
        earnerId: user.referredById,
        referredId: userId,
        purchaseAmount: proPrice,
        earnAmount: Math.round(proPrice * 0.2),
        description: `Промокод "${code}" — Pro ${promo.daysToAdd} дней`,
      },
    })
  }

  return { daysAdded: promo.daysToAdd, planExpiresAt: newExpiry }
}

// Валидировать промокод (без применения)
export async function validatePromoCode(code: string, userId: string) {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase().trim() } })
  if (!promo || !promo.isActive) return { valid: false, reason: 'Промокод не найден' }
  if (promo.expiresAt && promo.expiresAt < new Date()) return { valid: false, reason: 'Промокод истёк' }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { valid: false, reason: 'Лимит использований исчерпан' }

  const alreadyUsed = await prisma.promoCodeUse.findUnique({
    where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
  })
  if (alreadyUsed) return { valid: false, reason: 'Вы уже использовали этот промокод' }

  return { valid: true, daysToAdd: promo.daysToAdd, description: promo.description }
}

// Admin: создать промокод
export async function createPromoCode(data: {
  code: string
  description?: string
  daysToAdd: number
  maxUses?: number
  expiresAt?: Date
}) {
  return prisma.promoCode.create({
    data: { ...data, code: data.code.toUpperCase().trim() },
  })
}

// Admin: получить все промокоды
export async function getAllPromoCodes() {
  return prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { uses: true } } },
  })
}

// Admin: деактивировать промокод
export async function togglePromoCode(id: string, isActive: boolean) {
  return prisma.promoCode.update({ where: { id }, data: { isActive } })
}

// Admin: применить Pro к пользователю вручную (и начислить реферал)
export async function adminApplyPro(userId: string, days: number) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })

  const base = user.plan === 'PRO' && user.planExpiresAt && user.planExpiresAt > new Date()
    ? user.planExpiresAt
    : new Date()
  const newExpiry = new Date(base)
  newExpiry.setDate(newExpiry.getDate() + days)

  await prisma.user.update({
    where: { id: userId },
    data: { plan: 'PRO', planExpiresAt: newExpiry },
  })

  // Начислить реферальный бонус
  if (user.referredById) {
    const proPrice = 499
    await prisma.referralEarning.create({
      data: {
        earnerId: user.referredById,
        referredId: userId,
        purchaseAmount: proPrice,
        earnAmount: Math.round(proPrice * 0.2),
        description: `Pro ${days} дней (ручное начисление)`,
      },
    })
  }

  return { planExpiresAt: newExpiry }
}
