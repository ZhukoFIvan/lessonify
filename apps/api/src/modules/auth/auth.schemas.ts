import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов').max(100),
  name: z.string().min(2, 'Минимум 2 символа').max(100).trim(),
  role: z.enum(['TUTOR', 'STUDENT']).default('TUTOR'),
  // Для роли STUDENT — обязательный токен приглашения
  inviteToken: z.string().optional(),
  // Реферальный код пригласившего (опционально)
  referralCode: z.string().length(6).toUpperCase().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export const googleSchema = z.object({
  accessToken: z.string().min(1, 'Access token обязателен'),
  role: z.enum(['TUTOR', 'STUDENT']).optional(),
  inviteToken: z.string().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Некорректный email'),
  code: z.string().length(6, 'Код должен быть 6 цифр'),
  newPassword: z.string().min(8, 'Минимум 8 символов').max(100),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GoogleInput = z.infer<typeof googleSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
