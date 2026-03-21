import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import type { CreateStudentInput, UpdateStudentInput, StudentsQuery } from './students.schemas'

// ── Custom errors ─────────────────────────────────────────────────────────────

export class NotFoundError extends Error {
  readonly statusCode = 404
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

// ── Selects ───────────────────────────────────────────────────────────────────

// Поля ученика для списка
const studentListSelect = {
  id: true,
  tutorId: true,
  name: true,
  email: true,
  phone: true,
  subject: true,
  hourlyRate: true,
  color: true,
  notes: true,
  inviteToken: true,
  createdAt: true,
  user: {
    select: { id: true, avatarUrl: true, gender: true },
  },
  telegramConnection: {
    select: { id: true, telegramId: true, username: true },
  },
  _count: {
    select: { lessons: true },
  },
} as const

// Поля ученика для детального просмотра (с историей уроков)
const studentDetailSelect = {
  ...studentListSelect,
  lessons: {
    orderBy: { startTime: 'desc' as const },
    take: 20,
    select: {
      id: true,
      subject: true,
      startTime: true,
      durationMinutes: true,
      status: true,
      paymentStatus: true,
      price: true,
    },
  },
} as const

// ── Service ───────────────────────────────────────────────────────────────────

export const studentsService = {
  // ── GET /students ───────────────────────────────────────────────────────────

  async list(tutorId: string, query: StudentsQuery) {
    const { search, page, limit } = query
    const skip = (page - 1) * limit

    const where = {
      tutorId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { subject: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [students, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        select: studentListSelect,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ])

    // Считаем долг каждого ученика
    const studentIds = students.map((s) => s.id)
    const debts = await prisma.lesson.groupBy({
      by: ['studentId'],
      where: {
        studentId: { in: studentIds },
        paymentStatus: { in: ['PENDING', 'OVERDUE'] },
        status: 'COMPLETED',
      },
      _sum: { price: true },
    })

    const debtMap = new Map(debts.map((d) => [d.studentId, d._sum.price ?? 0]))

    return {
      data: students.map((s) => ({
        ...s,
        telegramConnected: s.telegramConnection !== null,
        telegramUsername: s.telegramConnection?.username ?? null,
        debtAmount: debtMap.get(s.id) ?? 0,
        lessonsCount: s._count.lessons,
        // Не раскрываем inviteToken в списке
        inviteToken: undefined,
      })),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    }
  },

  // ── POST /students ──────────────────────────────────────────────────────────

  async create(tutorId: string, data: CreateStudentInput) {
    const student = await prisma.student.create({
      data: {
        tutorId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        subject: data.subject || null,
        hourlyRate: data.hourlyRate ?? null,
        notes: data.notes || null,
        color: data.color ?? null,
      },
      select: studentListSelect,
    })

    return student
  },

  // ── GET /students/:id ───────────────────────────────────────────────────────

  async getById(tutorId: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: studentDetailSelect,
    })

    if (!student) throw new NotFoundError('Ученик не найден')
    if (student.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')

    // Суммарный долг ученика
    const debtAgg = await prisma.lesson.aggregate({
      where: {
        studentId,
        paymentStatus: { in: ['PENDING', 'OVERDUE'] },
        status: 'COMPLETED',
      },
      _sum: { price: true },
    })

    return {
      ...student,
      telegramConnected: student.telegramConnection !== null,
      telegramUsername: student.telegramConnection?.username ?? null,
      debtAmount: debtAgg._sum.price ?? 0,
      lessonsCount: student._count.lessons,
      inviteToken: undefined, // скрываем из ответа
    }
  },

  // ── PATCH /students/:id ─────────────────────────────────────────────────────

  async update(tutorId: string, studentId: string, data: UpdateStudentInput) {
    await studentsService.assertOwnership(tutorId, studentId)

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.subject !== undefined && { subject: data.subject || null }),
        ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.color !== undefined && { color: data.color }),
      },
      select: studentListSelect,
    })

    return student
  },

  // ── DELETE /students/:id ────────────────────────────────────────────────────

  async delete(tutorId: string, studentId: string) {
    await studentsService.assertOwnership(tutorId, studentId)

    // Cascade удаляет уроки, ДЗ, Telegram-связь через Prisma onDelete: Cascade
    await prisma.student.delete({ where: { id: studentId } })
  },

  // ── POST /students/:id/invite ───────────────────────────────────────────────

  async generateInvite(tutorId: string, studentId: string): Promise<string> {
    await studentsService.assertOwnership(tutorId, studentId)

    const token = crypto.randomBytes(32).toString('hex')

    await prisma.student.update({
      where: { id: studentId },
      data: { inviteToken: token },
    })

    const baseUrl = process.env.WEB_URL ?? 'http://localhost:3000'
    return `${baseUrl}/invite/${token}`
  },

  // ── POST /students/accept-invite (для уже зарегистрированных) ──────────────

  async acceptInvite(userId: string, token: string): Promise<{ studentId: string }> {
    // Находим Student с этим токеном
    const studentRecord = await prisma.student.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        tutorId: true,
        userId: true,
        name: true,
      },
    })

    if (!studentRecord) {
      throw new NotFoundError('Ссылка-приглашение недействительна или устарела')
    }

    // Если уже привязан к другому пользователю
    if (studentRecord.userId && studentRecord.userId !== userId) {
      throw new ForbiddenError('Эта ссылка уже использована другим пользователем')
    }

    // Если уже привязан к текущему пользователю
    if (studentRecord.userId === userId) {
      // Просто обнуляем токен и возвращаем успех
      await prisma.student.update({
        where: { id: studentRecord.id },
        data: { inviteToken: null },
      })
      return { studentId: studentRecord.id }
    }

    // Проверяем, нет ли уже связи между этим пользователем и репетитором
    const existingStudent = await prisma.student.findFirst({
      where: {
        tutorId: studentRecord.tutorId,
        userId,
        NOT: { id: studentRecord.id }, // Исключаем текущую запись
      },
    })

    if (existingStudent) {
      // Если уже есть связь с этим репетитором - обновляем её, а новую удаляем

      if (studentRecord.id !== existingStudent.id) {
        // Переносим уроки и ДЗ с удаляемой записи на существующую
        await prisma.$transaction([
          // Переносим уроки
          prisma.lesson.updateMany({
            where: { studentId: studentRecord.id },
            data: { studentId: existingStudent.id },
          }),
          // Переносим ДЗ
          prisma.homework.updateMany({
            where: { studentId: studentRecord.id },
            data: { studentId: existingStudent.id },
          }),
          // Обнуляем токен в существующей записи
          prisma.student.update({
            where: { id: existingStudent.id },
            data: { inviteToken: null },
          }),
          // Удаляем дублирующую запись (теперь без каскадного удаления уроков)
          prisma.student.deleteMany({ where: { id: studentRecord.id } }),
        ])
      } else {
        // Если это та же запись, просто обнуляем токен
        await prisma.student.update({
          where: { id: existingStudent.id },
          data: { inviteToken: null },
        })
      }

      return { studentId: existingStudent.id }
    }

    // Привязываем текущего пользователя к Student записи
    await prisma.student.update({
      where: { id: studentRecord.id },
      data: {
        userId,
        inviteToken: null,
      },
    })

    return { studentId: studentRecord.id }
  },

  // ── Helper ─────────────────────────────────────────────────────────────────

  async assertOwnership(tutorId: string, studentId: string): Promise<void> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { tutorId: true },
    })
    if (!student) throw new NotFoundError('Ученик не найден')
    if (student.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')
  },
}
