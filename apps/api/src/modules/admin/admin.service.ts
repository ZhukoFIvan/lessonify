import { prisma } from '../../lib/prisma'
import { subDays, startOfDay, format } from 'date-fns'

// ── Dashboard stats ────────────────────────────────────────────────────────────

export const adminService = {
  async getStats() {
    const [totalUsers, totalTutors, totalStudents, proUsers, blockedUsers, pendingWithdrawals] =
      await Promise.all([
        prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
        prisma.user.count({ where: { role: 'TUTOR' } }),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { plan: 'PRO' } }),
        prisma.user.count({ where: { isBlocked: true } }),
        prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      ])

    // Регистрации за последние 14 дней
    const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i))
    const registrationData = await Promise.all(
      days.map(async (day) => {
        const start = startOfDay(day)
        const end = new Date(start.getTime() + 86_400_000)
        const count = await prisma.user.count({
          where: { role: { not: 'ADMIN' }, createdAt: { gte: start, lt: end } },
        })
        return { date: format(day, 'dd.MM'), count }
      }),
    )

    // Последние 5 пользователей
    const recentUsers = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, plan: true, isBlocked: true, createdAt: true },
    })

    // Последние заявки на вывод
    const recentWithdrawals = await prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    })

    // Суммарный доход (все referral earnings)
    const earningsAgg = await prisma.referralEarning.aggregate({ _sum: { earnAmount: true } })
    const totalEarnings = earningsAgg._sum.earnAmount ?? 0

    return {
      totalUsers,
      totalTutors,
      totalStudents,
      proUsers,
      blockedUsers,
      pendingWithdrawals,
      totalEarnings,
      registrationData,
      recentUsers,
      recentWithdrawals,
    }
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUsers({ search, role, page }: { search?: string; role?: string; page: number }) {
    const take = 20
    const skip = (page - 1) * take

    const where: any = { role: { not: 'ADMIN' } }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role && role !== 'ALL') where.role = role

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true, name: true, email: true, role: true,
          plan: true, planExpiresAt: true,
          isBlocked: true, createdAt: true,
          tutor: { select: { id: true, students: { select: { id: true } } } },
          _count: { select: { referrals: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      users: users.map((u) => ({
        ...u,
        studentsCount: u.tutor?.students.length ?? 0,
        referralsCount: u._count.referrals,
      })),
      total,
      pages: Math.ceil(total / take),
      page,
    }
  },

  async getUserById(id: string) {
    return prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        tutor: {
          include: {
            students: { select: { id: true, name: true, createdAt: true } },
            lessons: {
              orderBy: { startTime: 'desc' },
              take: 10,
              select: { id: true, subject: true, startTime: true, price: true, paymentStatus: true },
            },
          },
        },
        referrals: { select: { id: true, name: true, createdAt: true } },
        withdrawalRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
  },

  async toggleBlock(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
    })
  },

  async setPlan(userId: string, plan: 'FREE' | 'PRO', months?: number) {
    const planExpiresAt =
      plan === 'PRO' && months
        ? new Date(Date.now() + months * 30 * 86_400_000)
        : plan === 'PRO'
          ? new Date(Date.now() + 30 * 86_400_000) // 1 month default
          : null

    return prisma.user.update({
      where: { id: userId },
      data: { plan, planExpiresAt },
    })
  },

  // ── Withdrawals ────────────────────────────────────────────────────────────

  async getWithdrawals({ status, page }: { status?: string; page: number }) {
    const take = 20
    const skip = (page - 1) * take
    const where: any = {}
    if (status && status !== 'ALL') where.status = status

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.withdrawalRequest.count({ where }),
    ])

    return { items, total, pages: Math.ceil(total / take), page }
  },

  async processWithdrawal(id: string, action: 'PAID' | 'REJECTED', adminNote?: string) {
    const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id } })

    if (action === 'PAID') {
      await prisma.referralEarning.updateMany({
        where: { earnerId: request.userId, paid: false },
        data: { paid: true },
      })
    }

    return prisma.withdrawalRequest.update({
      where: { id },
      data: { status: action, processedAt: new Date(), adminNote: adminNote ?? null },
    })
  },
}
