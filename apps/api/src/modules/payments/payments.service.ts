import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ForbiddenError } from '../students/students.service'
import type { PayLessonInput, SummaryQuery, DebtQuery } from './payments.schemas'
import type { PaymentSummary, DebtorStudent, MonthlyIncome } from '@tutorflow/types'

// ── Service ───────────────────────────────────────────────────────────────────

export const paymentsService = {
  // ── PATCH /lessons/:id/pay ──────────────────────────────────────────────────

  async payLesson(tutorId: string, lessonId: string, data: PayLessonInput) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { tutorId: true, paymentStatus: true, price: true, payment: true },
    })

    if (!lesson) throw new NotFoundError('Урок не найден')
    if (lesson.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')
    if (lesson.paymentStatus === 'PAID') {
      throw new BadRequestError('Урок уже отмечен как оплаченный')
    }

    const amount = data.amount ?? lesson.price
    const now = new Date()

    // Атомарно: обновляем урок и создаём запись Payment
    const [updatedLesson] = await prisma.$transaction([
      prisma.lesson.update({
        where: { id: lessonId },
        data: {
          paymentStatus: 'PAID',
          paidAt: now,
          status: lesson.paymentStatus === 'PENDING' ? 'COMPLETED' : undefined,
        },
        select: {
          id: true,
          paymentStatus: true,
          paidAt: true,
          price: true,
          student: { select: { id: true, name: true } },
        },
      }),
      // Upsert — если payment уже есть (edge case), обновляем
      prisma.payment.upsert({
        where: { lessonId },
        create: { lessonId, amount, note: data.note ?? null },
        update: { amount, note: data.note ?? null, paidAt: now },
      }),
    ])

    return updatedLesson
  },

  // ── PATCH /lessons/:id/unpay — отменить оплату ──────────────────────────────

  async unpayLesson(tutorId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { tutorId: true, paymentStatus: true },
    })

    if (!lesson) throw new NotFoundError('Урок не найден')
    if (lesson.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')
    if (lesson.paymentStatus !== 'PAID') {
      throw new BadRequestError('Урок не был отмечен как оплаченный')
    }

    await prisma.$transaction([
      prisma.lesson.update({
        where: { id: lessonId },
        data: { paymentStatus: 'PENDING', paidAt: null },
      }),
      prisma.payment.delete({ where: { lessonId } }),
    ])
  },

  // ── GET /payments/summary ───────────────────────────────────────────────────

  async getSummary(tutorId: string, query: SummaryQuery): Promise<{
    current: PaymentSummary
    chart: MonthlyIncome[]
  }> {
    const now = new Date()
    const targetMonth = query.month ? new Date(`${query.month}-01`) : now
    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)

    // ── Текущий месяц ────────────────────────────────────────────────────────
    const [paid, pending] = await prisma.$transaction([
      // Оплаченные уроки
      prisma.lesson.aggregate({
        where: {
          tutorId,
          paymentStatus: 'PAID',
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { price: true },
        _count: true,
      }),
      // Ожидающие оплаты (завершённые в этом месяце)
      prisma.lesson.aggregate({
        where: {
          tutorId,
          paymentStatus: { in: ['PENDING', 'OVERDUE'] },
          status: 'COMPLETED',
          startTime: { gte: monthStart, lte: monthEnd },
        },
        _sum: { price: true },
        _count: true,
      }),
    ])

    const totalLessons = paid._count + pending._count

    const current: PaymentSummary = {
      month: format(targetMonth, 'yyyy-MM'),
      totalEarned: paid._sum.price ?? 0,
      totalPending: pending._sum.price ?? 0,
      lessonsCount: totalLessons,
      paidLessonsCount: paid._count,
    }

    // ── График за N месяцев ───────────────────────────────────────────────────
    const chart = await paymentsService.getMonthlyChart(tutorId, query.months)

    return { current, chart }
  },

  async getMonthlyChart(tutorId: string, monthsCount: number): Promise<MonthlyIncome[]> {
    const now = new Date()

    // Строим массив месяцев от старых к новым
    const months = Array.from({ length: monthsCount }, (_, i) =>
      subMonths(startOfMonth(now), monthsCount - 1 - i),
    )

    // Одним запросом получаем все оплаченные уроки за период
    const paidLessons = await prisma.lesson.findMany({
      where: {
        tutorId,
        paymentStatus: 'PAID',
        paidAt: {
          gte: startOfMonth(months[0]!),
          lte: endOfMonth(now),
        },
      },
      select: { price: true, paidAt: true },
    })

    // Все незакрытые завершённые уроки за период
    const pendingLessons = await prisma.lesson.findMany({
      where: {
        tutorId,
        paymentStatus: { in: ['PENDING', 'OVERDUE'] },
        status: 'COMPLETED',
        startTime: {
          gte: startOfMonth(months[0]!),
          lte: endOfMonth(now),
        },
      },
      select: { price: true, startTime: true },
    })

    // Группируем по месяцам в памяти (эффективнее N SQL запросов)
    return months.map((month) => {
      const key = format(month, 'yyyy-MM')
      const mStart = startOfMonth(month)
      const mEnd = endOfMonth(month)

      const earned = paidLessons
        .filter((l) => l.paidAt && l.paidAt >= mStart && l.paidAt <= mEnd)
        .reduce((sum, l) => sum + l.price, 0)

      const pending = pendingLessons
        .filter((l) => l.startTime >= mStart && l.startTime <= mEnd)
        .reduce((sum, l) => sum + l.price, 0)

      return { month: key, earned, pending }
    })
  },

  // ── PATCH /payments/students/:id/pay-all ────────────────────────────────────

  async payAllForStudent(tutorId: string, studentId: string): Promise<{ count: number; total: number }> {
    // Verify student belongs to this tutor
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { tutorId: true },
    })
    if (!student) throw new NotFoundError('Ученик не найден')
    if (student.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')

    const unpaidLessons = await prisma.lesson.findMany({
      where: {
        tutorId,
        studentId,
        paymentStatus: { in: ['PENDING', 'OVERDUE'] },
        status: 'COMPLETED',
      },
      select: { id: true, price: true },
    })

    if (unpaidLessons.length === 0) return { count: 0, total: 0 }

    const now = new Date()
    const total = unpaidLessons.reduce((sum, l) => sum + l.price, 0)

    await prisma.$transaction([
      prisma.lesson.updateMany({
        where: { id: { in: unpaidLessons.map((l) => l.id) } },
        data: { paymentStatus: 'PAID', paidAt: now },
      }),
      ...unpaidLessons.map((l) =>
        prisma.payment.upsert({
          where: { lessonId: l.id },
          create: { lessonId: l.id, amount: l.price },
          update: { amount: l.price, paidAt: now },
        }),
      ),
    ])

    return { count: unpaidLessons.length, total }
  },

  // ── GET /payments/debt ──────────────────────────────────────────────────────

  async getDebtors(tutorId: string, query: DebtQuery): Promise<DebtorStudent[]> {
    // Все завершённые неоплаченные уроки с группировкой по ученику
    const debtGroups = await prisma.lesson.groupBy({
      by: ['studentId'],
      where: {
        tutorId,
        paymentStatus: { in: ['PENDING', 'OVERDUE'] },
        status: 'COMPLETED',
      },
      _sum: { price: true },
      _count: true,
      _max: { startTime: true },
      having: {
        price: { _sum: { gt: query.minDebt } },
      },
      orderBy: { _sum: { price: 'desc' } },
    })

    if (debtGroups.length === 0) return []

    // Загружаем данные учеников одним запросом
    const students = await prisma.student.findMany({
      where: { id: { in: debtGroups.map((g) => g.studentId) } },
      select: {
        id: true,
        name: true,
        user: { select: { avatarUrl: true } },
      },
    })

    const studentMap = new Map(students.map((s) => [s.id, s]))

    return debtGroups
      .map((group): DebtorStudent | null => {
        const student = studentMap.get(group.studentId)
        if (!student) return null

        return {
          studentId: student.id,
          studentName: student.name,
          avatarUrl: student.user?.avatarUrl ?? null,
          debtAmount: group._sum.price ?? 0,
          unpaidLessonsCount: group._count,
          lastLessonDate: group._max.startTime?.toISOString() ?? '',
        }
      })
      .filter((d): d is DebtorStudent => d !== null)
  },
}

// ── Custom errors ─────────────────────────────────────────────────────────────

export class BadRequestError extends Error {
  readonly statusCode = 400
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}
