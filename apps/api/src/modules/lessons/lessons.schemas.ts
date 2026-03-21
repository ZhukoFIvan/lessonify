import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

const lessonStatus = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'])
const paymentStatus = z.enum(['PENDING', 'PAID', 'OVERDUE'])

// ── Create ────────────────────────────────────────────────────────────────────

export const createLessonSchema = z
  .object({
    studentId: z.string().cuid('Некорректный ID ученика'),
    subject: z.string().min(1, 'Предмет обязателен').max(100).trim(),
    startTime: z.string().datetime({ message: 'Некорректная дата (ISO 8601)' }),
    durationMinutes: z.number().int().min(15).max(480).default(60),
    price: z.number().int().nonnegative('Цена не может быть отрицательной'),
    notes: z.string().max(2000).trim().optional(),
    // Повторяющиеся уроки
    repeat: z
      .object({
        frequency: z.enum(['weekly', 'biweekly']),
        count: z.number().int().min(2).max(52),
      })
      .optional(),
  })
  .refine(
    (d) => {
      const start = new Date(d.startTime)
      return !isNaN(start.getTime())
    },
    { message: 'Некорректная дата', path: ['startTime'] },
  )
  .refine(
    (d) => {
      const start = new Date(d.startTime)
      const now = new Date()
      return start > now
    },
    { message: 'Нельзя создать урок в прошлом', path: ['startTime'] },
  )

// ── Update ────────────────────────────────────────────────────────────────────

export const updateLessonSchema = z.object({
  subject: z.string().min(1).max(100).trim().optional(),
  startTime: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  status: lessonStatus.optional(),
  paymentStatus: paymentStatus.optional(),
  price: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).trim().optional(),
})

// ── Filters ───────────────────────────────────────────────────────────────────

export const lessonsQuerySchema = z.object({
  // Конкретная дата (YYYY-MM-DD) — уроки на этот день
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD')
    .optional(),
  // Диапазон дат
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  // Фильтры
  studentId: z.string().cuid().optional(),
  status: lessonStatus.optional(),
  paymentStatus: paymentStatus.optional(),
  // Пагинация
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
})

export type CreateLessonInput = z.infer<typeof createLessonSchema>
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>
export type LessonsQuery = z.infer<typeof lessonsQuerySchema>
