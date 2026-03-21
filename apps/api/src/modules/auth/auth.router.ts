import { Router } from 'express'
import type { Request, Response } from 'express'
import { ZodError, z } from 'zod'
import { registerSchema, loginSchema, googleSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas'
import { requireAuth } from '../../middleware/auth'
import { prisma } from '../../lib/prisma'
import {
  authService,
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  type AuthResult,
} from './auth.service'
import {
  REFRESH_COOKIE,
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
} from '../../lib/token'

export const authRouter = Router()

// ── Helpers ───────────────────────────────────────────────────────────────────

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, COOKIE_OPTIONS)
}

function sendAuthResult(res: Response, result: AuthResult): void {
  setRefreshCookie(res, result.refreshToken)
  res.json({ data: { user: result.user, accessToken: result.accessToken } })
}

function handleError(res: Response, err: unknown): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten().fieldErrors })
    return
  }
  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message })
    return
  }
  if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message })
    return
  }
  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message })
    return
  }
  console.error('[auth]', err)
  res.status(500).json({ error: 'Internal Server Error' })
}

// ── POST /auth/register ───────────────────────────────────────────────────────

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)
    const result = await authService.register(data, req)
    setRefreshCookie(res, result.refreshToken)
    res.status(201).json({ data: { user: result.user, accessToken: result.accessToken } })
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /auth/login ──────────────────────────────────────────────────────────

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body)
    const result = await authService.login(data, req)
    sendAuthResult(res, result)
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /auth/google ─────────────────────────────────────────────────────────

authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const data = googleSchema.parse(req.body)
    const result = await authService.googleAuth(data, req)
    sendAuthResult(res, result)
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /auth/refresh ────────────────────────────────────────────────────────

authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const oldToken = req.cookies[REFRESH_COOKIE] as string | undefined
    if (!oldToken) {
      res.status(401).json({ error: 'Refresh token отсутствует' })
      return
    }

    const { accessToken, refreshToken } = await authService.refresh(oldToken, req)
    setRefreshCookie(res, refreshToken)
    res.json({ data: { accessToken } })
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /auth/logout ─────────────────────────────────────────────────────────

authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies[REFRESH_COOKIE] as string | undefined
    if (token) {
      await authService.logout(token)
    }
    res.clearCookie(REFRESH_COOKIE, CLEAR_COOKIE_OPTIONS)
    res.json({ data: { message: 'Выход выполнен' } })
  } catch (err) {
    handleError(res, err)
  }
})

// ── PATCH /auth/profile — онбординг и настройки профиля ──────────────────────

const profileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
})

authRouter.patch('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = profileSchema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      select: {
        id: true, email: true, name: true,
        avatarUrl: true, gender: true, role: true,
        createdAt: true, updatedAt: true,
      },
    })
    res.json({ data: user })
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.flatten().fieldErrors })
      return
    }
    console.error('[auth/profile]', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// ── GET /auth/tutor — настройки репетитора ────────────────────────────────────

authRouter.get('/tutor', requireAuth, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId
    if (!tutorId) { res.status(403).json({ error: 'Только для репетиторов' }); return }

    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      select: {
        id: true,
        subjects: true,
        hourlyRate: true,
        timezone: true,
        reminderBeforeLesson: true,
        reminderAfterLesson: true,
      },
    })

    if (!tutor) { res.status(404).json({ error: 'Профиль не найден' }); return }
    res.json({ data: tutor })
  } catch (err) {
    handleError(res, err)
  }
})

// ── PATCH /auth/tutor — обновить настройки репетитора ─────────────────────────

const tutorSettingsSchema = z.object({
  subjects: z.array(z.string().max(100)).max(20).optional(),
  hourlyRate: z.number().int().nonnegative().nullable().optional(),
  timezone: z.string().max(100).optional(),
  reminderBeforeLesson: z.number().int().min(0).max(1440).optional(),
  reminderAfterLesson: z.number().int().min(0).max(1440).optional(),
})

authRouter.patch('/tutor', requireAuth, async (req: Request, res: Response) => {
  try {
    const tutorId = req.user!.tutorId
    if (!tutorId) { res.status(403).json({ error: 'Только для репетиторов' }); return }

    const data = tutorSettingsSchema.parse(req.body)

    const tutor = await prisma.tutor.update({
      where: { id: tutorId },
      data: {
        ...(data.subjects !== undefined && { subjects: data.subjects }),
        ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.reminderBeforeLesson !== undefined && { reminderBeforeLesson: data.reminderBeforeLesson }),
        ...(data.reminderAfterLesson !== undefined && { reminderAfterLesson: data.reminderAfterLesson }),
      },
      select: {
        id: true,
        subjects: true,
        hourlyRate: true,
        timezone: true,
        reminderBeforeLesson: true,
        reminderAfterLesson: true,
      },
    })

    res.json({ data: tutor })
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /auth/forgot-password ────────────────────────────────────────────────

authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    await authService.forgotPassword(email)
    // Всегда 200 — не раскрываем существование email
    res.json({ data: { message: 'Если email существует, код отправлен' } })
  } catch (err) {
    handleError(res, err)
  }
})

// ── POST /auth/reset-password ─────────────────────────────────────────────────

authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = resetPasswordSchema.parse(req.body)
    await authService.resetPassword(email, code, newPassword)
    res.json({ data: { message: 'Пароль успешно изменён' } })
  } catch (err) {
    handleError(res, err)
  }
})

// ── GET /auth/me ──────────────────────────────────────────────────────────────
// Быстрая проверка токена и получение текущего пользователя

authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { verifyAccessToken } = await import('../../lib/jwt')
    const payload = verifyAccessToken(authHeader.slice(7))

    const user = await import('../../lib/prisma').then(({ prisma }) =>
      prisma.user.findUniqueOrThrow({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          gender: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    )

    res.json({ data: { user, ...payload } })
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' })
  }
})
