import { startOfDay, endOfDay, addWeeks } from 'date-fns'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ForbiddenError } from '../students/students.service'

export class BadRequestError extends Error {
  readonly statusCode = 400
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}
import type { CreateLessonInput, UpdateLessonInput, LessonsQuery } from './lessons.schemas'
import { sendLessonCreatedToStudent, sendLessonCreatedToTutor } from '../telegram/telegram.bot'

// ── Конфликты расписания ───────────────────────────────────────────────────────

// Описание одного пересекающегося урока (для карточки/ответа).
export interface LessonConflict {
  id: string
  studentId: string
  studentName: string
  subject: string
  startUtc: Date
  endUtc: Date
}

// Бросается из create(), когда новый урок пересекается с существующими.
// Жёсткая блокировка: обхода (override) НЕТ — конфликт всегда блокирует.
export class LessonConflictError extends Error {
  readonly statusCode = 409
  readonly conflicts: LessonConflict[]
  // Таймзона репетитора — чтобы веб/бот показали время конфликта в его поясе.
  readonly timeZone?: string | undefined
  constructor(conflicts: LessonConflict[], timeZone?: string) {
    super('Время урока пересекается с другим уроком')
    this.name = 'LessonConflictError'
    this.conflicts = conflicts
    this.timeZone = timeZone
  }
}

// Статусы, которые реально занимают слот в расписании.
const BLOCKING_STATUSES = ['SCHEDULED', 'RESCHEDULED'] as const

// Длительности уроков ограничены 480 мин (8 ч), поэтому существующий урок,
// начавшийся раньше чем за 8 ч до нового, физически не может пересечься.
const MAX_LESSON_MS = 8 * 60 * 60 * 1000

// ── Select ────────────────────────────────────────────────────────────────────

const lessonSelect = {
  id: true,
  subject: true,
  startTime: true,
  durationMinutes: true,
  status: true,
  paymentStatus: true,
  price: true,
  notes: true,
  googleEventId: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      name: true,
      color: true,
      user: { select: { avatarUrl: true } },
    },
  },
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDateFilter(query: LessonsQuery): Prisma.DateTimeFilter<'Lesson'> | undefined {
  if (query.date) {
    const day = new Date(query.date)
    return { gte: startOfDay(day), lte: endOfDay(day) }
  }
  if (query.from || query.to) {
    return {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    }
  }
  return undefined
}

// ── Service ───────────────────────────────────────────────────────────────────

export const lessonsService = {
  // ── GET /lessons ────────────────────────────────────────────────────────────

  async list(tutorId: string, query: LessonsQuery) {
    const { page, limit, studentId, status, paymentStatus } = query
    const skip = (page - 1) * limit
    const dateFilter = buildDateFilter(query)

    const where: Prisma.LessonWhereInput = {
      tutorId,
      ...(dateFilter ? { startTime: dateFilter } : {}),
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    }

    const [lessons, total] = await prisma.$transaction([
      prisma.lesson.findMany({
        where,
        select: lessonSelect,
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where }),
    ])

    return {
      data: lessons,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    }
  },

  // ── Поиск пересечений ─────────────────────────────────────────────────────
  // Возвращает уроки репетитора (SCHEDULED|RESCHEDULED), пересекающиеся с
  // интервалом [startUtc, startUtc + durationMin). Полуоткрытый интервал:
  // касание встык (existing.end == newStart) НЕ считается конфликтом.
  // Можно передать клиента транзакции (tx), чтобы проверка шла атомарно с insert.

  async findConflicts(
    tutorId: string,
    startUtc: Date,
    durationMin: number,
    excludeLessonId?: string,
    client: Prisma.TransactionClient = prisma,
  ): Promise<LessonConflict[]> {
    const newStart = startUtc.getTime()
    const newEnd = newStart + durationMin * 60000

    // Индекс @@index([tutorId, startTime]). Ограничиваем окно слева на MAX_LESSON_MS:
    // урок, начавшийся раньше, не может тянуться до newStart (длительность ≤ 480 мин).
    const candidates = await client.lesson.findMany({
      where: {
        tutorId,
        status: { in: [...BLOCKING_STATUSES] },
        startTime: {
          gte: new Date(newStart - MAX_LESSON_MS),
          lt: new Date(newEnd),
        },
        ...(excludeLessonId ? { id: { not: excludeLessonId } } : {}),
      },
      select: {
        id: true,
        studentId: true,
        subject: true,
        startTime: true,
        durationMinutes: true,
        student: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    const conflicts: LessonConflict[] = []
    for (const l of candidates) {
      const exStart = l.startTime.getTime()
      const exEnd = exStart + l.durationMinutes * 60000
      // Полуоткрытое пересечение: exStart < newEnd && exEnd > newStart.
      if (exStart < newEnd && exEnd > newStart) {
        conflicts.push({
          id: l.id,
          studentId: l.studentId,
          studentName: l.student.name,
          subject: l.subject,
          startUtc: l.startTime,
          endUtc: new Date(exEnd),
        })
      }
    }
    return conflicts
  },

  // ── POST /lessons ───────────────────────────────────────────────────────────

  async create(tutorId: string, data: CreateLessonInput) {
    // Проверяем что ученик принадлежит этому репетитору
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      select: {
        tutorId: true,
        hourlyRate: true,
        name: true,
        timezone: true,
        telegramConnection: { select: { telegramId: true } },
      },
    })
    if (!student) throw new NotFoundError('Ученик не найден')
    if (student.tutorId !== tutorId) throw new ForbiddenError('Нет доступа к ученику')

    const startTime = new Date(data.startTime)

    // Если повторяющийся урок — создаём batch
    if (data.repeat) {
      return lessonsService.createRepeating(tutorId, data, startTime)
    }

    // Прошедший урок (status === 'COMPLETED') фиксируется задним числом —
    // проверка пересечений для него не нужна и не желательна.
    const isPastRecord = data.status === 'COMPLETED'

    // Таймзона репетитора нужна и для уведомлений, и для текста ошибки конфликта.
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { timezone: true, user: { select: { name: true } } },
    })
    const tutorTz = tutor?.timezone ?? 'Europe/Moscow'

    // Проверка пересечений + insert в ОДНОЙ транзакции (закрывает TOCTOU-окно):
    // если за время показа карточки слот заняли, конфликт всплывёт здесь.
    const lesson = await prisma.$transaction(async (tx) => {
      if (!isPastRecord) {
        const conflicts = await lessonsService.findConflicts(
          tutorId,
          startTime,
          data.durationMinutes,
          undefined,
          tx,
        )
        if (conflicts.length > 0) {
          // ЖЁСТКАЯ блокировка — обхода нет.
          throw new LessonConflictError(conflicts, tutorTz)
        }
      }
      return tx.lesson.create({
        data: {
          tutorId,
          studentId: data.studentId,
          subject: data.subject,
          startTime,
          durationMinutes: data.durationMinutes,
          price: data.price,
          notes: data.notes ?? null,
          ...(data.status ? { status: data.status } : {}),
        },
        select: lessonSelect,
      })
    })

    // 1. Ученику (если подключен Telegram)
    if (student.telegramConnection?.telegramId && tutor) {
      sendLessonCreatedToStudent(student.telegramConnection.telegramId, {
        tutorName: tutor.user.name,
        subject: data.subject,
        startTime,
        timezone: student.timezone ?? tutorTz,
      }).catch((err) => console.error('[telegram] Failed to notify student:', err))
    }

    // 2. Репетитору (если подключен Telegram)
    const tutorConnection = await prisma.telegramConnection.findUnique({
      where: { tutorId },
      select: { telegramId: true },
    })
    if (tutorConnection?.telegramId) {
      sendLessonCreatedToTutor(tutorConnection.telegramId, {
        studentName: student.name,
        subject: data.subject,
        startTime,
        timezone: tutorTz,
      }).catch((err) => console.error('[telegram] Failed to notify tutor:', err))
    }

    return { data: lesson }
  },

  // Создание серии повторяющихся уроков
  async createRepeating(tutorId: string, data: CreateLessonInput, firstStart: Date) {
    const { repeat, ...lessonData } = data
    if (!repeat) throw new Error('repeat is required')

    const weeksStep = repeat.frequency === 'weekly' ? 1 : 2

    const lessons = await prisma.$transaction(
      Array.from({ length: repeat.count }, (_, i) => {
        const startTime = addWeeks(firstStart, i * weeksStep)
        return prisma.lesson.create({
          data: {
            tutorId,
            studentId: lessonData.studentId,
            subject: lessonData.subject,
            startTime,
            durationMinutes: lessonData.durationMinutes,
            price: lessonData.price,
            notes: lessonData.notes ?? null,
          },
          select: lessonSelect,
        })
      }),
    )

    // Отправляем уведомления о первом уроке из серии
    const student = await prisma.student.findUnique({
      where: { id: lessonData.studentId },
      select: {
        name: true,
        timezone: true,
        telegramConnection: { select: { telegramId: true } },
      },
    })

    if (student) {
      const tutor = await prisma.tutor.findUnique({
        where: { id: tutorId },
        select: { timezone: true, user: { select: { name: true } } },
      })
      const tutorTz = tutor?.timezone ?? 'Europe/Moscow'

      // Уведомление ученику
      if (student.telegramConnection?.telegramId && tutor) {
        sendLessonCreatedToStudent(student.telegramConnection.telegramId, {
          tutorName: tutor.user.name,
          subject: lessonData.subject,
          startTime: firstStart,
          timezone: student.timezone ?? tutorTz,
        }).catch((err) => console.error('[telegram] Failed to notify student:', err))
      }

      // Уведомление репетитору
      const tutorConnection = await prisma.telegramConnection.findUnique({
        where: { tutorId },
        select: { telegramId: true },
      })
      if (tutorConnection?.telegramId) {
        sendLessonCreatedToTutor(tutorConnection.telegramId, {
          studentName: student.name,
          subject: lessonData.subject,
          startTime: firstStart,
          timezone: tutorTz,
        }).catch((err) => console.error('[telegram] Failed to notify tutor:', err))
      }
    }

    return { data: lessons, count: lessons.length }
  },

  // ── GET /lessons/:id ────────────────────────────────────────────────────────

  async getById(tutorId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        ...lessonSelect,
        tutorId: true,
        homework: {
          select: {
            id: true,
            description: true,
            deadline: true,
            status: true,
            feedback: true,
            createdAt: true,
          },
        },
        payment: {
          select: { id: true, amount: true, paidAt: true, note: true },
        },
      },
    })

    if (!lesson) throw new NotFoundError('Урок не найден')
    if (lesson.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')

    return lesson
  },

  // ── PATCH /lessons/:id ──────────────────────────────────────────────────────

  async update(tutorId: string, lessonId: string, data: UpdateLessonInput) {
    await lessonsService.assertOwnership(tutorId, lessonId)

    const updateData: Prisma.LessonUpdateInput = {
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.startTime !== undefined && { startTime: new Date(data.startTime) }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.notes !== undefined && { notes: data.notes }),
    }

    // Если меняем paymentStatus на PAID — проставляем paidAt
    if (data.paymentStatus !== undefined) {
      updateData.paymentStatus = data.paymentStatus
      if (data.paymentStatus === 'PAID') {
        updateData.paidAt = new Date()
      } else {
        updateData.paidAt = null
      }
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
      select: lessonSelect,
    })

    return lesson
  },

  // ── DELETE /lessons/:id ─────────────────────────────────────────────────────

  async delete(tutorId: string, lessonId: string) {
    await lessonsService.assertOwnership(tutorId, lessonId)
    await prisma.lesson.delete({ where: { id: lessonId } })
  },

  // ── Для студентов — видят только свои уроки ─────────────────────────────────

  async listForStudent(userId: string, query: LessonsQuery) {
    const { page, limit, status } = query
    const skip = (page - 1) * limit
    const dateFilter = buildDateFilter(query)

    const where: Prisma.LessonWhereInput = {
      student: { userId },
      ...(dateFilter ? { startTime: dateFilter } : {}),
      ...(status ? { status } : {}),
    }

    const [lessons, total] = await prisma.$transaction([
      prisma.lesson.findMany({
        where,
        select: {
          ...lessonSelect,
          // Для студента показываем имя репетитора
          tutor: {
            select: {
              id: true,
              user: { select: { name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.lesson.count({ where }),
    ])

    return { data: lessons, total, page, limit, hasMore: skip + limit < total }
  },

  // ── POST /lessons/:id/remind — отправить напоминание вручную ──────────────

  async sendManualReminder(tutorId: string, lessonId: string): Promise<void> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        tutorId: true,
        subject: true,
        startTime: true,
        student: {
          select: {
            name: true,
            userId: true,
            telegramConnection: { select: { telegramId: true } },
          },
        },
      },
    })

    if (!lesson) throw new NotFoundError('Урок не найден')
    if (lesson.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')

    // TelegramConnection привязан к конкретной Student-записи.
    // Если студент подключил Telegram через другого репетитора —
    // ищем его telegram по userId через все его записи.
    let studentTelegramId = lesson.student.telegramConnection?.telegramId
    if (!studentTelegramId && lesson.student.userId) {
      const conn = await prisma.telegramConnection.findFirst({
        where: { student: { userId: lesson.student.userId } },
        select: { telegramId: true },
      })
      studentTelegramId = conn?.telegramId ?? null
    }

    if (!studentTelegramId) {
      throw new BadRequestError('У ученика не подключен Telegram')
    }

    // Получаем имя репетитора
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { user: { select: { name: true } } },
    })

    if (!tutor) throw new NotFoundError('Репетитор не найден')

    // Вычисляем время до урока
    const minutesLeft = Math.round((lesson.startTime.getTime() - Date.now()) / 60000)
    let timeLabel: string
    if (minutesLeft <= 0) {
      timeLabel = 'несколько минут'
    } else if (minutesLeft < 60) {
      timeLabel = `${minutesLeft} мин`
    } else {
      const hours = Math.round(minutesLeft / 60)
      timeLabel = hours === 1 ? '1 час' : `${hours} часа`
    }

    // Отправляем напоминание
    const { sendStudentLessonReminder } = await import('../telegram/telegram.bot')
    await sendStudentLessonReminder(studentTelegramId, {
      tutorName: tutor.user.name,
      subject: lesson.subject,
      startTime: lesson.startTime,
      timeLabel,
    })
  },

  // ── Helper ──────────────────────────────────────────────────────────────────

  async assertOwnership(tutorId: string, lessonId: string): Promise<void> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { tutorId: true },
    })
    if (!lesson) throw new NotFoundError('Урок не найден')
    if (lesson.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')
  },
}
