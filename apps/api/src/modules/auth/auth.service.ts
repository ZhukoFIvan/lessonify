import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import type { User } from '@prisma/client'
import type { Request } from 'express'
import { prisma } from '../../lib/prisma'
import { signAccessToken } from '../../lib/jwt'
import {
  generateRefreshToken,
  hashRefreshToken,
  getRefreshExpiry,
} from '../../lib/token'
import type { AuthTokenPayload, UserRole } from '@tutorflow/types'
import type { RegisterInput, LoginInput, GoogleInput } from './auth.schemas'
import { generateReferralCode } from '../referrals/referrals.service'

// ── Custom errors ─────────────────────────────────────────────────────────────

export class ConflictError extends Error {
  readonly statusCode = 409
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends Error {
  readonly statusCode = 401
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class BadRequestError extends Error {
  readonly statusCode = 400
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type SafeUser = Omit<User, 'passwordHash' | 'googleId'>

type TokenPair = { accessToken: string; refreshToken: string }
export type AuthResult = TokenPair & { user: SafeUser }

// ── Email транспорт (Nodemailer) ──────────────────────────────────────────────

function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function sendPasswordResetEmail(email: string, name: string, code: string): Promise<void> {
  const transporter = createMailTransporter()
  await transporter.sendMail({
    from: `"TutorFlow" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to: email,
    subject: 'Сброс пароля — TutorFlow',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">Сброс пароля</h2>
        <p style="color:#6B7280;margin:0 0 24px">Привет, ${name}! Вот твой код для сброса пароля:</p>
        <div style="background:#F3F4FF;border-radius:12px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#6C63FF">${code}</span>
        </div>
        <p style="color:#6B7280;margin:24px 0 0;font-size:13px">Код действителен 15 минут. Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
      </div>
    `,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _pw, googleId: _gid, ...safe } = user
  return safe
}

export async function buildTokenPayload(userId: string): Promise<AuthTokenPayload> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      tutor: { select: { id: true } },
      students: { select: { id: true }, take: 1 }, // берем первую Student запись (если есть)
    },
  })

  return {
    sub: user.id,
    role: user.role as UserRole,
    ...(user.tutor ? { tutorId: user.tutor.id } : {}),
    // Для студентов studentId не критичен, т.к. у них может быть несколько записей
    // Оставляем для обратной совместимости, но берем первую запись
    ...(user.students.length > 0 ? { studentId: user.students[0]!.id } : {}),
  }
}

async function issueTokens(userId: string, req: Request): Promise<TokenPair> {
  const payload = await buildTokenPayload(userId)
  const accessToken = signAccessToken(payload)
  const refreshToken = generateRefreshToken()

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshExpiry(),
      userAgent: req.headers['user-agent'] ?? null,
      ip: (req.ip ?? req.socket.remoteAddress) ?? null,
    },
  })

  return { accessToken, refreshToken }
}

// ── Auth Service ──────────────────────────────────────────────────────────────

export const authService = {
  // ── Register ────────────────────────────────────────────────────────────────

  async register(data: RegisterInput, req: Request): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new ConflictError('Email уже используется')

    const passwordHash = await bcrypt.hash(data.password, 12)

    let user: User

    if (data.role === 'TUTOR') {
      // Проверяем реферальный код если передан
      let referredById: string | undefined
      if (data.referralCode) {
        const referrer = await prisma.user.findUnique({ where: { referralCode: data.referralCode } })
        if (referrer) referredById = referrer.id
      }

      const trialExpiresAt = new Date()
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 14)

      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: 'TUTOR',
          referralCode: generateReferralCode(),
          plan: 'PRO',
          planExpiresAt: trialExpiresAt,
          trialUsed: true,
          ...(referredById ? { referredById } : {}),
          tutor: { create: { subjects: [] } },
        },
      })
    } else {
      // STUDENT — обязательно нужен inviteToken
      if (!data.inviteToken) {
        throw new BadRequestError('Для регистрации ученика нужна ссылка-приглашение')
      }

      const student = await prisma.student.findUnique({
        where: { inviteToken: data.inviteToken },
      })
      if (!student) throw new BadRequestError('Недействительная ссылка-приглашение')
      if (student.userId) throw new ConflictError('Приглашение уже использовано')

      user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          role: 'STUDENT',
        },
      })

      // Привязываем ученика к аккаунту и сбрасываем токен
      await prisma.student.update({
        where: { id: student.id },
        data: { userId: user.id, inviteToken: null },
      })
    }

    const tokens = await issueTokens(user.id, req)
    return { user: toSafeUser(user), ...tokens }
  },

  // ── Login ───────────────────────────────────────────────────────────────────

  async login(data: LoginInput, req: Request): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email: data.email } })

    // Единое сообщение — не раскрываем, что именно неверно
    const invalid = () => new UnauthorizedError('Неверный email или пароль')

    if (!user || !user.passwordHash) throw invalid()

    const valid = await bcrypt.compare(data.password, user.passwordHash)
    if (!valid) throw invalid()

    if (user.isBlocked) throw new UnauthorizedError('Аккаунт заблокирован. Обратитесь в поддержку.')

    const tokens = await issueTokens(user.id, req)
    return { user: toSafeUser(user), ...tokens }
  },

  // ── Google OAuth ─────────────────────────────────────────────────────────────

  async googleAuth(data: GoogleInput, req: Request): Promise<AuthResult> {
    // 1. Получаем информацию о пользователе через Google userinfo endpoint
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    })

    if (!res.ok) {
      throw new UnauthorizedError('Некорректный Google токен')
    }

    const googleUser = await res.json() as {
      id: string
      email: string
      name: string
      picture?: string
    }

    if (!googleUser.id || !googleUser.email) {
      throw new UnauthorizedError('Некорректный Google токен')
    }

    // 2. Ищем существующего пользователя по googleId или email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: googleUser.email }] },
    })

    if (!user) {
      // 3a. Первый вход через Google — создаём аккаунт
      const role = data.role ?? 'TUTOR'

      if (role === 'STUDENT') {
        if (!data.inviteToken) {
          throw new BadRequestError('Для входа как ученик нужна ссылка-приглашение')
        }
        const student = await prisma.student.findUnique({
          where: { inviteToken: data.inviteToken },
        })
        if (!student) throw new BadRequestError('Недействительная ссылка-приглашение')
        if (student.userId) throw new ConflictError('Приглашение уже использовано')

        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.id,
            name: googleUser.name ?? googleUser.email,
            avatarUrl: googleUser.picture ?? null,
            role: 'STUDENT',
          },
        })

        await prisma.student.update({
          where: { id: student.id },
          data: { userId: user.id, inviteToken: null },
        })
      } else {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.id,
            name: googleUser.name ?? googleUser.email,
            avatarUrl: googleUser.picture ?? null,
            role: 'TUTOR',
            tutor: { create: { subjects: [] } },
          },
        })
      }
    } else if (!user.googleId) {
      // 3b. Email уже есть — привязываем Google-аккаунт
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.id,
          avatarUrl: user.avatarUrl ?? googleUser.picture ?? null,
        },
      })
    }

    const tokens = await issueTokens(user.id, req)
    return { user: toSafeUser(user), ...tokens }
  },

  // ── Refresh ─────────────────────────────────────────────────────────────────

  async refresh(oldToken: string, req: Request): Promise<TokenPair> {
    const tokenHash = hashRefreshToken(oldToken)

    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } })

    if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token недействителен или истёк')
    }

    // Rotation: отзываем старый токен
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    return issueTokens(stored.userId, req)
  },

  // ── Logout ───────────────────────────────────────────────────────────────────

  async logout(token: string): Promise<void> {
    const tokenHash = hashRefreshToken(token)
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  },

  // ── Forgot password ──────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } })
    // Не раскрываем, существует ли email
    if (!user || !user.passwordHash) return

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = await bcrypt.hash(code, 10)

    // Удаляем старые неиспользованные коды
    await prisma.passwordResetCode.deleteMany({ where: { userId: user.id } })

    // Создаём новый код (15 минут)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await prisma.passwordResetCode.create({
      data: { userId: user.id, codeHash, expiresAt },
    })

    await sendPasswordResetEmail(user.email, user.name, code)
  },

  // ── Reset password ────────────────────────────────────────────────────────────

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new BadRequestError('Пользователь не найден')

    const resetCode = await prisma.passwordResetCode.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!resetCode) throw new BadRequestError('Код устарел или недействителен')

    const valid = await bcrypt.compare(code, resetCode.codeHash)
    if (!valid) throw new BadRequestError('Неверный код')

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await Promise.all([
      prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
    ])
  },

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  // Вызывается из cron (задача #8) — удаляем истёкшие токены

  async cleanupExpiredTokens(): Promise<number> {
    const { count } = await prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] },
    })
    return count
  },
}
