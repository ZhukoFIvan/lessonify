import { z } from 'zod'

export const createStudentSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100).trim(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.string().max(100).trim().optional().or(z.literal('')),
  hourlyRate: z.number().int().positive().optional(),
  notes: z.string().max(1000).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Некорректный HEX-цвет')
    .optional(),
})

export const updateStudentSchema = createStudentSchema.partial()

export const studentsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type StudentsQuery = z.infer<typeof studentsQuerySchema>
