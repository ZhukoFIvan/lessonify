import { prisma } from '../../lib/prisma'
import type { CreateSlotInput, UpdateSlotInput, CreateBookingInput, RespondBookingInput } from './availability.schemas'

export class NotFoundError extends Error {
  readonly statusCode = 404
  constructor(message: string) { super(message); this.name = 'NotFoundError' }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403
  constructor(message: string) { super(message); this.name = 'ForbiddenError' }
}

export class ConflictError extends Error {
  readonly statusCode = 409
  constructor(message: string) { super(message); this.name = 'ConflictError' }
}

export const availabilityService = {
  // ── Слоты (репетитор) ────────────────────────────────────────────────────

  async createSlot(tutorId: string, data: CreateSlotInput) {
    return prisma.availabilitySlot.create({ data: { tutorId, ...data } })
  },

  async listSlots(tutorId: string) {
    return prisma.availabilitySlot.findMany({
      where: { tutorId },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }, { startMinute: 'asc' }],
    })
  },

  async updateSlot(tutorId: string, slotId: string, data: UpdateSlotInput) {
    const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } })
    if (!slot) throw new NotFoundError('Слот не найден')
    if (slot.tutorId !== tutorId) throw new ForbiddenError('Доступ запрещён')
    return prisma.availabilitySlot.update({
      where: { id: slotId },
      data: {
        ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
        ...(data.startHour !== undefined && { startHour: data.startHour }),
        ...(data.startMinute !== undefined && { startMinute: data.startMinute }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })
  },

  async deleteSlot(tutorId: string, slotId: string) {
    const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } })
    if (!slot) throw new NotFoundError('Слот не найден')
    if (slot.tutorId !== tutorId) throw new ForbiddenError('Доступ запрещён')
    await prisma.availabilitySlot.delete({ where: { id: slotId } })
  },

  // ── Публичные слоты (ученик) ─────────────────────────────────────────────

  async getPublicSlots(tutorId: string) {
    return prisma.availabilitySlot.findMany({
      where: { tutorId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
    })
  },

  // ── Запросы на запись (ученик создаёт) ──────────────────────────────────

  async createBooking(studentId: string, data: CreateBookingInput) {
    const slot = await prisma.availabilitySlot.findUnique({ where: { id: data.slotId } })
    if (!slot || !slot.isActive) throw new NotFoundError('Слот недоступен')

    const requestedAt = new Date(data.requestedAt)

    // Проверяем, нет ли уже активного запроса на этот слот+время
    const existing = await prisma.bookingRequest.findFirst({
      where: {
        slotId: data.slotId,
        requestedAt,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })
    if (existing) throw new ConflictError('На это время уже есть запрос')

    return prisma.bookingRequest.create({
      data: {
        slotId: data.slotId,
        studentId,
        tutorId: slot.tutorId,
        requestedAt,
        note: data.note ?? null,
      },
      include: { slot: true },
    })
  },

  async listMyBookings(studentId: string) {
    return prisma.bookingRequest.findMany({
      where: { studentId },
      include: { slot: true },
      orderBy: { requestedAt: 'asc' },
    })
  },

  // ── Запросы на запись (репетитор управляет) ──────────────────────────────

  async listBookings(tutorId: string, status?: string) {
    return prisma.bookingRequest.findMany({
      where: {
        tutorId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        student: { select: { id: true, name: true, color: true, user: { select: { avatarUrl: true } } } },
        slot: true,
      },
      orderBy: { requestedAt: 'asc' },
    })
  },

  async respondToBooking(tutorId: string, bookingId: string, data: RespondBookingInput) {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: { student: true, slot: true },
    })
    if (!booking) throw new NotFoundError('Запрос не найден')
    if (booking.tutorId !== tutorId) throw new ForbiddenError('Доступ запрещён')
    if (booking.status !== 'PENDING') throw new ConflictError('Запрос уже обработан')

    if (data.status === 'CONFIRMED') {
      // Определяем цену: параметр → ставка ученика → ставка репетитора
      const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } })
      const price = data.price ?? booking.student.hourlyRate ?? tutor?.hourlyRate ?? 0

      // Создаём урок и обновляем запрос в транзакции
      const [lesson] = await prisma.$transaction([
        prisma.lesson.create({
          data: {
            tutorId,
            studentId: booking.studentId,
            subject: booking.student.subject ?? 'Урок',
            startTime: booking.requestedAt,
            durationMinutes: booking.slot.durationMinutes,
            price,
          },
        }),
      ])

      return prisma.bookingRequest.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED', lessonId: lesson.id },
      })
    }

    return prisma.bookingRequest.update({
      where: { id: bookingId },
      data: { status: data.status },
    })
  },
}
