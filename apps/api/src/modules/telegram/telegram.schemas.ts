import { z } from 'zod'

export const connectTelegramSchema = z.object({
  // Роль определяется из JWT — репетитор или ученик
  // Код передаётся с фронта (пользователь вводит вручную или открывает deep link)
  code: z.string().min(1, 'Код обязателен').max(200),
})

export type ConnectTelegramInput = z.infer<typeof connectTelegramSchema>
