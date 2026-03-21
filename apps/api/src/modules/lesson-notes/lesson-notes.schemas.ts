import { z } from 'zod'

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Заметка не может быть пустой').max(10000).trim(),
})

export const updateNoteSchema = z.object({
  content: z.string().min(1).max(10000).trim(),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
