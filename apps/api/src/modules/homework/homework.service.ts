import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError, ForbiddenError } from '../students/students.service'
import type { CreateHomeworkInput, UpdateHomeworkInput, SubmitHomeworkInput, HomeworkQuery } from './homework.schemas'

// ── Select ────────────────────────────────────────────────────────────────────

const homeworkSelect = {
  id: true,
  description: true,
  deadline: true,
  status: true,
  feedback: true,
  submissionText: true,
  fileUrls: true,
  attachmentUrls: true,
  createdAt: true,
  updatedAt: true,
  lesson: {
    select: {
      id: true,
      subject: true,
      startTime: true,
    },
  },
  student: {
    select: {
      id: true,
      name: true,
      color: true,
      user: { select: { avatarUrl: true } },
    },
  },
} as const

// ── Service ───────────────────────────────────────────────────────────────────

export const homeworkService = {
  // ── GET /homework (репетитор) ───────────────────────────────────────────────

  async listForTutor(tutorId: string, query: HomeworkQuery) {
    const { page, limit, studentId, status, overdue } = query
    const skip = (page - 1) * limit
    const now = new Date()

    const where: Prisma.HomeworkWhereInput = {
      tutorId,
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      // Просроченные: дедлайн прошёл и статус не REVIEWED
      ...(overdue
        ? {
            deadline: { lt: now },
            status: { not: 'REVIEWED' },
          }
        : {}),
    }

    const [items, total] = await prisma.$transaction([
      prisma.homework.findMany({
        where,
        select: homeworkSelect,
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.homework.count({ where }),
    ])

    return {
      data: items.map((hw) => ({
        ...hw,
        isOverdue: hw.deadline !== null && hw.deadline < now && hw.status !== 'REVIEWED',
      })),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    }
  },

  // ── GET /homework/my (ученик) ───────────────────────────────────────────────

  async listForStudent(userId: string, query: HomeworkQuery) {
    const { page, limit, status } = query
    const skip = (page - 1) * limit
    const now = new Date()

    const where: Prisma.HomeworkWhereInput = {
      student: { userId },
      ...(status ? { status } : {}),
    }

    const [items, total] = await prisma.$transaction([
      prisma.homework.findMany({
        where,
        select: {
          ...homeworkSelect,
          // Для ученика показываем имя репетитора
          tutor: {
            select: {
              id: true,
              user: { select: { name: true, avatarUrl: true } },
            },
          },
        },
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.homework.count({ where }),
    ])

    return {
      data: items.map((hw) => ({
        ...hw,
        isOverdue: hw.deadline !== null && hw.deadline < now && hw.status !== 'REVIEWED',
      })),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    }
  },

  // ── POST /lessons/:lessonId/homework ────────────────────────────────────────

  async create(tutorId: string, lessonId: string, data: CreateHomeworkInput) {
    // Проверяем что урок принадлежит репетитору
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { tutorId: true, studentId: true },
    })

    if (!lesson) throw new NotFoundError('Урок не найден')
    if (lesson.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')

    const homework = await prisma.homework.create({
      data: {
        lessonId,
        tutorId,
        studentId: lesson.studentId,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline) : null,
        attachmentUrls: data.attachmentUrls ?? [],
      },
      select: homeworkSelect,
    })

    return homework
  },

  // ── PATCH /homework/:id (репетитор) ─────────────────────────────────────────

  async updateByTutor(tutorId: string, homeworkId: string, data: UpdateHomeworkInput) {
    await homeworkService.assertTutorOwnership(tutorId, homeworkId)

    const homework = await prisma.homework.update({
      where: { id: homeworkId },
      data: {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.feedback !== undefined && { feedback: data.feedback }),
      },
      select: homeworkSelect,
    })

    return homework
  },

  // ── PATCH /homework/:id/submit (ученик — сдать ДЗ) ─────────────────────────

  async submitByStudent(userId: string, homeworkId: string, data: SubmitHomeworkInput) {
    const hw = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: { student: { select: { userId: true } }, status: true },
    })

    if (!hw) throw new NotFoundError('Домашнее задание не найдено')
    if (hw.student.userId !== userId) throw new ForbiddenError('Нет доступа')
    if (hw.status === 'REVIEWED') {
      throw new ConflictError('Задание уже проверено')
    }

    return prisma.homework.update({
      where: { id: homeworkId },
      data: {
        status: 'SUBMITTED',
        ...(data.submissionText !== undefined && { submissionText: data.submissionText }),
        ...(data.fileUrls !== undefined && { fileUrls: data.fileUrls }),
      },
      select: homeworkSelect,
    })
  },

  // ── DELETE /homework/:id ────────────────────────────────────────────────────

  async delete(tutorId: string, homeworkId: string) {
    await homeworkService.assertTutorOwnership(tutorId, homeworkId)
    await prisma.homework.delete({ where: { id: homeworkId } })
  },

  // ── GET /homework/stats (репетитор) ─────────────────────────────────────────

  async getStats(tutorId: string) {
    const now = new Date()

    const [assigned, submitted, overdue] = await prisma.$transaction([
      prisma.homework.count({ where: { tutorId, status: 'ASSIGNED' } }),
      prisma.homework.count({ where: { tutorId, status: 'SUBMITTED' } }),
      prisma.homework.count({
        where: {
          tutorId,
          deadline: { lt: now },
          status: { not: 'REVIEWED' },
        },
      }),
    ])

    return { assigned, submitted, overdue }
  },

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async assertTutorOwnership(tutorId: string, homeworkId: string): Promise<void> {
    const hw = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: { tutorId: true },
    })
    if (!hw) throw new NotFoundError('Домашнее задание не найдено')
    if (hw.tutorId !== tutorId) throw new ForbiddenError('Нет доступа')
  },
}

// ── Custom errors ─────────────────────────────────────────────────────────────

export class ConflictError extends Error {
  readonly statusCode = 409
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}
