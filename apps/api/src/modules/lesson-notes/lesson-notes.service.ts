import { prisma } from '../../lib/prisma'
import type { CreateNoteInput, UpdateNoteInput } from './lesson-notes.schemas'

export class NotFoundError extends Error {
  readonly statusCode = 404
  constructor(message: string) { super(message); this.name = 'NotFoundError' }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403
  constructor(message: string) { super(message); this.name = 'ForbiddenError' }
}

export const lessonNotesService = {
  async create(tutorId: string, lessonId: string, data: CreateNoteInput) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson) throw new NotFoundError('Урок не найден')
    if (lesson.tutorId !== tutorId) throw new ForbiddenError('Доступ запрещён')

    return prisma.lessonNote.create({
      data: { lessonId, tutorId, content: data.content },
    })
  },

  async listForLesson(lessonId: string, requesterId: string, role: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { student: { select: { userId: true } } },
    })
    if (!lesson) throw new NotFoundError('Урок не найден')

    if (role === 'TUTOR') {
      if (lesson.tutorId !== requesterId) {
        throw new ForbiddenError('Доступ запрещён')
      }
    } else {
      // STUDENT — проверяем, что requesterId (userId) совпадает с userId ученика
      if (lesson.student.userId !== requesterId) throw new ForbiddenError('Доступ запрещён')
    }

    return prisma.lessonNote.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async update(tutorId: string, noteId: string, data: UpdateNoteInput) {
    const note = await prisma.lessonNote.findUnique({ where: { id: noteId } })
    if (!note) throw new NotFoundError('Заметка не найдена')
    if (note.tutorId !== tutorId) throw new ForbiddenError('Доступ запрещён')

    return prisma.lessonNote.update({ where: { id: noteId }, data: { content: data.content } })
  },

  async delete(tutorId: string, noteId: string) {
    const note = await prisma.lessonNote.findUnique({ where: { id: noteId } })
    if (!note) throw new NotFoundError('Заметка не найдена')
    if (note.tutorId !== tutorId) throw new ForbiddenError('Доступ запрещён')

    await prisma.lessonNote.delete({ where: { id: noteId } })
  },
}

