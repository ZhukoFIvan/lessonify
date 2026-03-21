import { z } from 'zod'

export const createSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  startMinute: z.number().int().min(0).max(59).default(0),
  durationMinutes: z.number().int().min(30).max(480).default(60),
})

export const updateSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startHour: z.number().int().min(0).max(23).optional(),
  startMinute: z.number().int().min(0).max(59).optional(),
  durationMinutes: z.number().int().min(30).max(480).optional(),
  isActive: z.boolean().optional(),
})

export const createBookingSchema = z.object({
  slotId: z.string().min(1),
  requestedAt: z.string().datetime({ offset: true }),
  note: z.string().max(500).trim().optional(),
})

export const respondBookingSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED']),
  price: z.number().int().positive().optional(),
})

export type CreateSlotInput = z.infer<typeof createSlotSchema>
export type UpdateSlotInput = z.infer<typeof updateSlotSchema>
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type RespondBookingInput = z.infer<typeof respondBookingSchema>
