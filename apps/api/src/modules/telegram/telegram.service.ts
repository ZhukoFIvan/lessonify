import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../students/students.service'
import type { AuthTokenPayload } from '@tutorflow/types'
import { sendMessage } from './telegram.bot'

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? 'tutorflow_bot'

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateConnectCode(): string {
  return crypto.randomBytes(16).toString('hex') // 32 символа
}

// ── Service ───────────────────────────────────────────────────────────────────

export const telegramService = {
  // ── GET /telegram/link — получить ссылку для привязки ──────────────────────
  // Создаёт или перезаписывает запись TelegramConnection с новым connectCode.
  // Пользователь открывает deep link — бот получает /start <code>.

  async generateLink(user: AuthTokenPayload): Promise<{ deepLink: string; code: string }> {
    const code = generateConnectCode()

    if (user.role === 'TUTOR') {
      const tutorId = user.tutorId
      if (!tutorId) throw new NotFoundError('Профиль репетитора не найден')

      await prisma.telegramConnection.upsert({
        where: { tutorId },
        create: { tutorId, telegramId: '', connectCode: code },
        update: { connectCode: code, telegramId: '' },
      })

      return {
        code,
        deepLink: `https://t.me/${BOT_USERNAME}?start=tutor_${code}`,
      }
    } else {
      const studentId = user.studentId
      if (!studentId) throw new NotFoundError('Профиль ученика не найден')

      await prisma.telegramConnection.upsert({
        where: { studentId },
        create: { studentId, telegramId: '', connectCode: code },
        update: { connectCode: code, telegramId: '' },
      })

      return {
        code,
        deepLink: `https://t.me/${BOT_USERNAME}?start=student_${code}`,
      }
    }
  },

  // ── POST /telegram/connect — ручная привязка по коду ───────────────────────
  // Альтернативный флоу: пользователь вводит код в боте командой /start <code>
  // или копирует код и вставляет в приложение (если уже в боте)

  async connectByCode(telegramId: string, code: string): Promise<void> {
    const connection = await prisma.telegramConnection.findUnique({
      where: { connectCode: code },
    })

    if (!connection) {
      throw new NotFoundError('Код недействителен или уже использован')
    }

    await prisma.telegramConnection.update({
      where: { id: connection.id },
      data: { telegramId, connectCode: null },
    })
  },

  // ── GET /telegram/status — статус подключения ───────────────────────────────

  async getStatus(user: AuthTokenPayload): Promise<{
    connected: boolean
    username: string | null
    firstName: string | null
  }> {
    const where =
      user.role === 'TUTOR'
        ? { tutorId: user.tutorId }
        : { studentId: user.studentId }

    const connection = await prisma.telegramConnection.findUnique({ where })

    if (!connection || !connection.telegramId) {
      return { connected: false, username: null, firstName: null }
    }

    return {
      connected: true,
      username: connection.username,
      firstName: connection.firstName,
    }
  },

  // ── DELETE /telegram/disconnect — отключить ─────────────────────────────────

  async disconnect(user: AuthTokenPayload): Promise<void> {
    const where =
      user.role === 'TUTOR'
        ? { tutorId: user.tutorId }
        : { studentId: user.studentId }

    // Получаем связь перед удалением, чтобы отправить уведомление
    const connection = await prisma.telegramConnection.findUnique({ where })

    // Если аккаунт был привязан, отправляем уведомление об отключении
    if (connection?.telegramId) {
      await sendMessage(
        connection.telegramId,
        `❌ *Аккаунт отключён*\n\n` +
          `Ваш аккаунт TutorFlow был отключён от Telegram.\n\n` +
          `Вы больше не будете получать уведомления о занятиях и оплатах.\n\n` +
          `Чтобы подключить бот заново, откройте настройки в приложении TutorFlow.`,
      )
    }

    await prisma.telegramConnection.deleteMany({ where })
  },
}
