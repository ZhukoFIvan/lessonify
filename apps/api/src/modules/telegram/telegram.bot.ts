import { Telegraf, Markup } from 'telegraf'
import { prisma } from '../../lib/prisma'

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set')
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'

// ── /start ────────────────────────────────────────────────────────────────────
// Форматы deep link:
//   /start tutor_<connectCode>   — привязка репетитора
//   /start student_<connectCode> — привязка ученика

bot.command('start', async (ctx) => {
  const payload = ctx.message.text.split(' ')[1] ?? ''
  const tgUser = ctx.from

  // ── Deep link с кодом привязки ─────────────────────────────────────────────
  if (payload.startsWith('tutor_') || payload.startsWith('student_')) {
    const [type, connectCode] = payload.split('_') as [string, string]

    const connection = await prisma.telegramConnection.findUnique({
      where: { connectCode },
      include: {
        tutor: { include: { user: true } },
        student: true,
      },
    })

    if (!connection || !connectCode) {
      await ctx.reply(
        '❌ Код привязки недействителен или уже использован.\n\nПолучите новый код в настройках приложения.',
      )
      return
    }

    // Привязываем Telegram-аккаунт
    await prisma.telegramConnection.update({
      where: { id: connection.id },
      data: {
        telegramId: String(tgUser.id),
        username: tgUser.username ?? null,
        firstName: tgUser.first_name,
        connectCode: null, // сжигаем код
      },
    })

    const name =
      type === 'tutor'
        ? connection.tutor?.user.name ?? 'Репетитор'
        : connection.student?.name ?? 'Ученик'

    // WebApp кнопка работает только с HTTPS
    const isHttps = WEB_URL.startsWith('https://')
    const replyOptions: any = { parse_mode: 'Markdown' }

    if (isHttps) {
      replyOptions.reply_markup = Markup.keyboard([
        [Markup.button.webApp('Открыть TutorFlow', WEB_URL)],
      ]).resize().reply_markup
    }

    await ctx.reply(
      `✅ *Аккаунт успешно привязан!*\n\nПривет, ${name}! Теперь вы будете получать уведомления о занятиях и оплатах прямо в Telegram.`,
      replyOptions,
    )
    return
  }

  // ── Обычный /start без кода ────────────────────────────────────────────────
  await ctx.reply(
    `👋 Привет! Я бот *TutorFlow* — помогаю репетиторам управлять расписанием и напоминаю об уроках.\n\nЧтобы подключить бота к своему аккаунту, откройте настройки в приложении TutorFlow.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Открыть TutorFlow', WEB_URL)],
      ]),
    },
  )
})

// ── /help ─────────────────────────────────────────────────────────────────────

bot.command('help', async (ctx) => {
  await ctx.reply(
    `*TutorFlow Bot* — команды:\n\n` +
      `/start — главное меню\n` +
      `/help — эта справка\n\n` +
      `Бот автоматически напоминает о занятиях и оплатах. Управление — в приложении TutorFlow.`,
    { parse_mode: 'Markdown' },
  )
})

// ── Публичные функции отправки сообщений ─────────────────────────────────────

export async function sendMessage(telegramId: string, text: string): Promise<void> {
  try {
    await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'Markdown' })
  } catch (err) {
    // Пользователь мог заблокировать бота — логируем, не падаем
    console.error(`[telegram] Failed to send to ${telegramId}:`, err)
  }
}

export async function sendLessonReminder(
  telegramId: string,
  opts: {
    studentName: string
    subject: string
    startTime: Date
    timeLabel: string // '1 час' | '24 часа'
  },
): Promise<void> {
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  })

  await sendMessage(
    telegramId,
    `⏰ *Напоминание об уроке*\n\n` +
      `Через *${opts.timeLabel}* урок с *${opts.studentName}*\n` +
      `📚 Предмет: ${opts.subject}\n` +
      `🕐 Время: ${time}`,
  )
}

export async function sendPaymentReminder(
  telegramId: string,
  opts: {
    studentName: string
    subject: string
    amount: number
  },
): Promise<void> {
  await sendMessage(
    telegramId,
    `💳 *Напоминание об оплате*\n\n` +
      `Урок с *${opts.studentName}* завершён.\n` +
      `📚 Предмет: ${opts.subject}\n` +
      `💰 Сумма: ${opts.amount.toLocaleString('ru-RU')} ₽\n\n` +
      `Отметьте оплату в приложении TutorFlow.`,
  )
}

export async function sendStudentLessonReminder(
  telegramId: string,
  opts: {
    tutorName: string
    subject: string
    startTime: Date
    timeLabel: string
  },
): Promise<void> {
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  })

  await sendMessage(
    telegramId,
    `⏰ *Напоминание об уроке*\n\n` +
      `Через *${opts.timeLabel}* урок с *${opts.tutorName}*\n` +
      `📚 Предмет: ${opts.subject}\n` +
      `🕐 Время: ${time}`,
  )
}

export async function sendLessonCreatedToStudent(
  telegramId: string,
  opts: {
    tutorName: string
    subject: string
    startTime: Date
  },
): Promise<void> {
  const date = opts.startTime.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow',
  })
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  })

  await sendMessage(
    telegramId,
    `📅 *Новый урок назначен!*\n\n` +
      `Репетитор *${opts.tutorName}* назначил урок:\n` +
      `📚 Предмет: ${opts.subject}\n` +
      `📆 Дата: ${date}\n` +
      `🕐 Время: ${time}`,
  )
}

export async function sendLessonCreatedToTutor(
  telegramId: string,
  opts: {
    studentName: string
    subject: string
    startTime: Date
  },
): Promise<void> {
  const date = opts.startTime.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow',
  })
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  })

  await sendMessage(
    telegramId,
    `📅 *Урок добавлен в расписание*\n\n` +
      `Ученик: *${opts.studentName}*\n` +
      `📚 Предмет: ${opts.subject}\n` +
      `📆 Дата: ${date}\n` +
      `🕐 Время: ${time}`,
  )
}
