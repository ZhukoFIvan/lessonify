import { prisma } from '../../lib/prisma'
import { subDays, startOfDay, startOfMonth, format } from 'date-fns'
import { decryptCardDetails } from '../referrals/referrals.service'

// ── Dashboard stats ────────────────────────────────────────────────────────────

export const adminService = {
  async getStats() {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const last7 = subDays(now, 7)
    const last30 = subDays(now, 30)

    const [
      totalUsers,
      totalTutors,
      totalStudents,
      proUsers,
      blockedUsers,
      pendingWithdrawals,
      activeProUsers,
      totalLessons,
      lessonsThisMonth,
      reg7,
      reg30,
      botConnections,
      botLinked,
      revenueAgg,
      revenueMonthAgg,
      paidOrdersCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
      prisma.user.count({ where: { role: 'TUTOR' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { plan: 'PRO' } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      // Активные PRO: либо без срока, либо срок ещё не истёк
      prisma.user.count({
        where: { plan: 'PRO', OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }] },
      }),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { startTime: { gte: monthStart } } }),
      prisma.user.count({ where: { role: { not: 'ADMIN' }, createdAt: { gte: last7 } } }),
      prisma.user.count({ where: { role: { not: 'ADMIN' }, createdAt: { gte: last30 } } }),
      prisma.telegramConnection.count(),
      // «Привязанные» = есть telegramId (реально подключённый аккаунт, а не пустой код)
      prisma.telegramConnection.count({ where: { telegramId: { not: null } } }),
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.order.count({ where: { status: 'PAID' } }),
    ])

    // Регистрации за последние 14 дней
    const days = Array.from({ length: 14 }, (_, i) => subDays(now, 13 - i))
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
      activeProUsers,
      blockedUsers,
      pendingWithdrawals,
      totalEarnings,
      totalLessons,
      lessonsThisMonth,
      registrations7d: reg7,
      registrations30d: reg30,
      botConnections,
      botLinked,
      revenueTotal: revenueAgg._sum.amount ?? 0,
      revenueThisMonth: revenueMonthAgg._sum.amount ?? 0,
      paidOrdersCount,
      registrationData,
      recentUsers,
      recentWithdrawals,
    }
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  async getUsers({ search, role, page }: { search?: string | undefined; role?: string | undefined; page: number }) {
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
    const user = await prisma.user.findUniqueOrThrow({
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
    return {
      ...user,
      withdrawalRequests: user.withdrawalRequests.map((w) => ({
        ...w,
        cardDetails: decryptCardDetails(w.cardDetails),
      })),
    }
  },

  async toggleBlock(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
    })
  },

  async setPlan(userId: string, plan: 'FREE' | 'PRO', months?: number, days?: number) {
    // Приоритет у точного числа дней, иначе месяцы (×30), иначе дефолт 30 дней.
    const addDays = plan === 'PRO' ? (days ?? (months ? months * 30 : 30)) : 0

    const planExpiresAt =
      plan === 'PRO' ? new Date(Date.now() + addDays * 86_400_000) : null

    return prisma.user.update({
      where: { id: userId },
      data: { plan, planExpiresAt },
    })
  },

  // Назначение роли (в т.ч. выдача/снятие прав администратора).
  async setRole(userId: string, role: 'TUTOR' | 'STUDENT' | 'ADMIN') {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, plan: true, isBlocked: true },
    })
  },

  // ── Withdrawals ────────────────────────────────────────────────────────────

  async getWithdrawals({ status, page }: { status?: string | undefined; page: number }) {
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

    return {
      items: items.map((it) => ({ ...it, cardDetails: decryptCardDetails(it.cardDetails) })),
      total,
      pages: Math.ceil(total / take),
      page,
    }
  },

  async processWithdrawal(id: string, action: 'PAID' | 'REJECTED', adminNote?: string) {
    const request = await prisma.withdrawalRequest.findUniqueOrThrow({ where: { id } })

    if (action === 'PAID') {
      // Закрываем ИМЕННО сумму заявки (как в referralsService.markPaid):
      // самые старые неоплаченные начисления, пока не наберётся request.amount.
      const unpaid = await prisma.referralEarning.findMany({
        where: { earnerId: request.userId, paid: false },
        orderBy: { createdAt: 'asc' },
        select: { id: true, earnAmount: true },
      })
      const idsToPay: string[] = []
      let covered = 0
      for (const earning of unpaid) {
        if (covered >= request.amount) break
        idsToPay.push(earning.id)
        covered += earning.earnAmount
      }
      if (idsToPay.length > 0) {
        await prisma.referralEarning.updateMany({
          where: { id: { in: idsToPay } },
          data: { paid: true },
        })
      }
    }

    return prisma.withdrawalRequest.update({
      where: { id },
      data: { status: action, processedAt: new Date(), adminNote: adminNote ?? null },
    })
  },

  // ── Orders / Payments (Robokassa) ────────────────────────────────────────────

  async getOrders({ status, page }: { status?: string | undefined; page: number }) {
    const take = 20
    const skip = (page - 1) * take
    const where: any = {}
    if (status && status !== 'ALL') where.status = status

    const [items, total, paidAgg, paidCount, pendingCount, failedCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'FAILED' } }),
    ])

    return {
      items,
      total,
      pages: Math.ceil(total / take),
      page,
      summary: {
        revenueTotal: paidAgg._sum.amount ?? 0,
        paidCount,
        pendingCount,
        failedCount,
      },
    }
  },

  // ── Telegram bot stats ───────────────────────────────────────────────────────

  async getBotStats() {
    const [total, linked, tutorConnections, studentConnections, pendingCodes, totalTutors, botStarted, startsAgg] =
      await Promise.all([
        prisma.telegramConnection.count(),
        prisma.telegramConnection.count({ where: { telegramId: { not: null } } }),
        prisma.telegramConnection.count({ where: { tutorId: { not: null }, telegramId: { not: null } } }),
        prisma.telegramConnection.count({ where: { studentId: { not: null }, telegramId: { not: null } } }),
        // Записи с кодом привязки, но ещё без telegramId — незавершённое подключение
        prisma.telegramConnection.count({ where: { telegramId: null } }),
        prisma.tutor.count(),
        // Воронка бота: уникальные, кто нажал /start, и суммарное число нажатий
        prisma.botUser.count(),
        prisma.botUser.aggregate({ _sum: { startCount: true } }),
      ])
    const botStartsTotal = startsAgg._sum.startCount ?? 0

    const recent = await prisma.telegramConnection.findMany({
      where: { telegramId: { not: null } },
      orderBy: { connectedAt: 'desc' },
      take: 15,
      include: {
        tutor: { select: { user: { select: { name: true, email: true } } } },
        student: { select: { name: true } },
      },
    })

    return {
      total,
      linked,
      tutorConnections,
      studentConnections,
      pendingCodes,
      totalTutors,
      // Конверсия: какая доля репетиторов подключила бота
      tutorConversion: totalTutors > 0 ? Math.round((tutorConnections / totalTutors) * 100) : 0,
      // Воронка: нажали /start → привязали аккаунт
      botStarted,
      botStartsTotal,
      startToLinkedConversion: botStarted > 0 ? Math.round((linked / botStarted) * 100) : 0,
      recent: recent.map((c) => ({
        id: c.id,
        username: c.username,
        firstName: c.firstName,
        connectedAt: c.connectedAt,
        target: c.tutorId
          ? { type: 'tutor' as const, name: c.tutor?.user.name ?? null, email: c.tutor?.user.email ?? null }
          : { type: 'student' as const, name: c.student?.name ?? null, email: null },
      })),
    }
  },

  // ── Tutors → Students browser ────────────────────────────────────────────────

  async getTutors({ search, page }: { search?: string | undefined; page: number }) {
    const take = 20
    const skip = (page - 1) * take

    const where: any = {}
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [tutors, total] = await Promise.all([
      prisma.tutor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          subjects: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, plan: true, planExpiresAt: true, isBlocked: true } },
          _count: { select: { students: true, lessons: true } },
        },
      }),
      prisma.tutor.count({ where }),
    ])

    return {
      tutors: tutors.map((t) => ({
        id: t.id,
        userId: t.user.id,
        name: t.user.name,
        email: t.user.email,
        plan: t.user.plan,
        planExpiresAt: t.user.planExpiresAt,
        isBlocked: t.user.isBlocked,
        subjects: t.subjects,
        createdAt: t.createdAt,
        studentsCount: t._count.students,
        lessonsCount: t._count.lessons,
      })),
      total,
      pages: Math.ceil(total / take),
      page,
    }
  },

  async getTutorById(tutorId: string) {
    const tutor = await prisma.tutor.findUniqueOrThrow({
      where: { id: tutorId },
      select: {
        id: true,
        subjects: true,
        hourlyRate: true,
        timezone: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, plan: true, planExpiresAt: true, isBlocked: true, createdAt: true } },
        students: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            subject: true,
            createdAt: true,
            _count: { select: { lessons: true } },
          },
        },
      },
    })

    // Агрегаты по урокам: всего, оплачено (сумма по PAID paymentStatus)
    const [lessonsCount, paidAgg, completedCount] = await Promise.all([
      prisma.lesson.count({ where: { tutorId } }),
      prisma.lesson.aggregate({ where: { tutorId, paymentStatus: 'PAID' }, _sum: { price: true } }),
      prisma.lesson.count({ where: { tutorId, status: 'COMPLETED' } }),
    ])

    return {
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
      userId: tutor.user.id,
      plan: tutor.user.plan,
      planExpiresAt: tutor.user.planExpiresAt,
      isBlocked: tutor.user.isBlocked,
      subjects: tutor.subjects,
      hourlyRate: tutor.hourlyRate,
      timezone: tutor.timezone,
      createdAt: tutor.user.createdAt,
      lessonsCount,
      completedCount,
      revenue: paidAgg._sum.price ?? 0,
      students: tutor.students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        subject: s.subject,
        createdAt: s.createdAt,
        lessonsCount: s._count.lessons,
      })),
    }
  },
}
