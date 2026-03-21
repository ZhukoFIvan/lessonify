import { z } from 'zod'

export const payLessonSchema = z.object({
  amount: z.number().int().positive('Сумма должна быть положительной').optional(),
  note: z.string().max(500).trim().optional(),
})

export const summaryQuerySchema = z.object({
  // YYYY-MM, по умолчанию текущий месяц
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Формат: YYYY-MM')
    .optional(),
  // Сколько месяцев для графика (по умолчанию 6)
  months: z.coerce.number().int().min(1).max(24).default(6),
})

export const debtQuerySchema = z.object({
  // Минимальная сумма долга для включения в список
  minDebt: z.coerce.number().int().nonnegative().default(0),
})

export const invoiceQuerySchema = z.object({
  studentId: z.string().min(1),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат: YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат: YYYY-MM-DD'),
})

export type PayLessonInput = z.infer<typeof payLessonSchema>
export type SummaryQuery = z.infer<typeof summaryQuerySchema>
export type DebtQuery = z.infer<typeof debtQuerySchema>
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>
