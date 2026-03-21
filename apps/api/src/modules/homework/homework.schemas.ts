import { z } from 'zod'

const homeworkStatus = z.enum(['ASSIGNED', 'SUBMITTED', 'REVIEWED'])

export const createHomeworkSchema = z.object({
  description: z.string().min(1, 'Описание обязательно').max(2000).trim(),
  deadline: z.string().datetime({ message: 'Некорректная дата (ISO 8601)' }).optional(),
  attachmentUrls: z.array(z.string().url()).max(5).optional(),
})

export const updateHomeworkSchema = z.object({
  description: z.string().min(1).max(2000).trim().optional(),
  deadline: z.string().datetime().nullable().optional(),
  status: homeworkStatus.optional(),
  feedback: z.string().max(2000).trim().nullable().optional(),
})

export const submitHomeworkSchema = z.object({
  submissionText: z.string().max(2000).trim().optional(),
  fileUrls: z.array(z.string().url()).max(5).optional(),
})

export const homeworkQuerySchema = z.object({
  // Фильтры для репетитора
  studentId: z.string().cuid().optional(),
  status: homeworkStatus.optional(),
  // overdue=true — только просроченные
  overdue: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>
export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>
export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema>
export type HomeworkQuery = z.infer<typeof homeworkQuerySchema>
