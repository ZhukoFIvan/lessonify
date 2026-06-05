import { Telegraf, Markup } from 'telegraf'
import { prisma } from '../../lib/prisma'
import { voiceService, type DraftRender } from './voice.service'

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.warn('[telegram] TELEGRAM_BOT_TOKEN is not set — bot disabled')
}

export const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
  : (null as unknown as Telegraf)

const WEB_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'

// URL веб-приложения для кнопок/меню бота.
// WebApp-кнопка Telegram требует HTTPS, поэтому в проде используем публичный URL.
const APP_URL =
  process.env.WEB_APP_URL ?? process.env.FRONTEND_URL ?? 'https://app.lessonify.ru'

// ── /start ────────────────────────────────────────────────────────────────────
// Форматы deep link:
//   /start tutor_<connectCode>   — привязка репетитора
//   /start student_<connectCode> — привязка ученика

bot?.command('start', async (ctx) => {
  const payload = ctx.message.text.split(' ')[1] ?? ''
  const tgUser = ctx.from

  // ── Deep link с кодом привязки ─────────────────────────────────────────────
  if (payload.startsWith('tutor_') || payload.startsWith('student_')) {
    const [type, connectCode] = payload.split('_') as [string, string]

    const connection = await prisma.telegramConnection.findUnique({
      where: { connectCode },
      include: {
        tutor: { include: { user: true } },
        student: { include: { user: true } },
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
        : connection.student?.user?.name ?? connection.student?.name ?? 'Ученик'

    // WebApp кнопка работает только с HTTPS
    const isHttps = WEB_URL.startsWith('https://')
    const replyOptions: any = { parse_mode: 'Markdown' }

    if (isHttps) {
      replyOptions.reply_markup = Markup.keyboard([
        [Markup.button.webApp('Открыть Lessonify', WEB_URL)],
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
    `👋 Привет! Я бот *Lessonify* — CRM-ассистент репетитора.\n\n` +
      `• Напоминаю об уроках и оплатах\n` +
      `• 🎤 *Новое:* добавляй уроки голосом — просто пришли голосовое сообщение, ` +
      `например: «поставь Ане физику завтра в 5 на час»\n\n` +
      `Чтобы подключить бота к своему аккаунту, откройте настройки в приложении Lessonify.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Открыть Lessonify', APP_URL)],
      ]),
    },
  )
})

// ── /help ─────────────────────────────────────────────────────────────────────

bot?.command('help', async (ctx) => {
  await ctx.reply(
    `*Lessonify Bot* — команды:\n\n` +
      `/start — главное меню\n` +
      `/menu — открыть приложение\n` +
      `/help — эта справка\n\n` +
      `🎤 *Голосом:* пришлите голосовое сообщение, чтобы добавить урок — ` +
      `например, «поставь Ане физику завтра в 5 на час». Я распознаю и покажу карточку ` +
      `урока с кнопками подтверждения и правки.\n\n` +
      `Бот также автоматически напоминает о занятиях и оплатах. ` +
      `Полное управление — в приложении Lessonify.`,
    { parse_mode: 'Markdown' },
  )
})

// ── /menu ─────────────────────────────────────────────────────────────────────

bot?.command('menu', async (ctx) => {
  await ctx.reply(
    `📋 *Меню Lessonify*\n\n` +
      `Откройте приложение, чтобы управлять учениками, расписанием и оплатами.\n\n` +
      `🎤 Подсказка: чтобы быстро добавить урок, просто пришлите голосовое сообщение.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('Открыть приложение', APP_URL)],
      ]),
    },
  )
})

// ── Настройка профиля бота (описание, команды, кнопка меню) ─────────────────────
// Best-effort: вызывается при старте, не должна падать сервер.

export async function configureBotProfile(): Promise<void> {
  if (!bot) return

  try {
    await bot.telegram.setMyDescription(
      'Lessonify — CRM-ассистент для репетитора. Напоминаю об уроках и оплатах прямо в Telegram. ' +
        'НОВОЕ: добавляй уроки голосом — пришли голосовое сообщение вроде «поставь Ане физику завтра в 5 на час», ' +
        'и я создам урок. Чтобы начать, подключите бота в приложении Lessonify.',
    )
  } catch (err) {
    console.error('[telegram] setMyDescription failed:', err)
  }

  try {
    await bot.telegram.setMyShortDescription(
      'CRM-ассистент репетитора: напоминания об уроках и оплатах + добавление уроков голосом.',
    )
  } catch (err) {
    console.error('[telegram] setMyShortDescription failed:', err)
  }

  try {
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Главное меню и подключение' },
      { command: 'menu', description: 'Открыть приложение Lessonify' },
      { command: 'help', description: 'Справка и команды' },
    ])
  } catch (err) {
    console.error('[telegram] setMyCommands failed:', err)
  }

  // Кнопка меню, открывающая веб-приложение. WebApp требует HTTPS.
  try {
    if (APP_URL.startsWith('https://')) {
      await bot.telegram.setChatMenuButton({
        menuButton: {
          type: 'web_app',
          text: 'Приложение',
          web_app: { url: APP_URL },
        },
      })
    } else {
      // На localhost WebApp недоступен — оставляем стандартную кнопку команд.
      await bot.telegram.setChatMenuButton({ menuButton: { type: 'commands' } })
    }
  } catch (err) {
    console.error('[telegram] setChatMenuButton failed:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Голосовая диктовка уроков.
// ВАЖНО: command-обработчики (/start, /help, /menu) зарегистрированы ВЫШЕ, до
// общего on('text'), чтобы Telegraf маршрутизировал команды раньше текста.
// ─────────────────────────────────────────────────────────────────────────────

// Отправляет рендер новым сообщением.
async function sendRender(ctx: any, render: DraftRender): Promise<void> {
  await ctx.reply(
    render.text,
    render.keyboard ? { reply_markup: render.keyboard } : undefined,
  )
}

// Редактирует текущее сообщение (для callback-кнопок). Всегда гасит спиннер.
async function editRender(ctx: any, render: DraftRender): Promise<void> {
  try {
    await ctx.answerCbQuery()
  } catch {
    /* спиннер мог уже истечь — игнорируем */
  }
  try {
    await ctx.editMessageText(
      render.text,
      render.keyboard
        ? { reply_markup: render.keyboard }
        : { reply_markup: { inline_keyboard: [] } },
    )
  } catch (err) {
    // Если редактирование не удалось (например, сообщение не менялось) — шлём новое.
    console.error('[telegram] editMessageText failed:', err)
    try {
      await sendRender(ctx, render)
    } catch {
      /* best-effort */
    }
  }
}

// Скачивает аудио голосового сообщения в Buffer.
async function downloadVoice(ctx: any, fileId: string): Promise<Buffer> {
  const link = await ctx.telegram.getFileLink(fileId)
  const res = await fetch(link.toString())
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ── Голосовое сообщение ────────────────────────────────────────────────────────

bot?.on('voice', async (ctx) => {
  const telegramId = String(ctx.from.id)

  try {
    // (1) Резолвим репетитора по привязке.
    const connection = await prisma.telegramConnection.findFirst({
      where: { telegramId, tutorId: { not: null } },
      include: { tutor: true },
    })

    if (!connection || !connection.tutorId || !connection.tutor) {
      await ctx.reply(
        '🎤 Голосовое добавление уроков доступно репетиторам, привязавшим аккаунт.\n\n' +
          'Подключите бота в приложении Lessonify (Настройки → Telegram).',
      )
      return
    }

    // (2) Без ключа Gemini — голосовой ассистент пока недоступен.
    if (!process.env.GEMINI_API_KEY) {
      await ctx.reply(
        '🎤 Голосовой помощник скоро появится. А пока добавляйте уроки в приложении Lessonify.',
      )
      return
    }

    // (3) Скачиваем аудио.
    const audio = await downloadVoice(ctx, ctx.message.voice.file_id)
    const mimeType = ctx.message.voice.mime_type ?? 'audio/ogg'

    // (4) Если есть активное редактирование поля — применяем значение из голоса,
    //     иначе создаём новый черновик.
    const editing = await voiceService.getActiveEditing(telegramId)
    let render: DraftRender | null
    if (editing) {
      render = await voiceService.applyEditValue({ telegramId, audio, mimeType })
    } else {
      render = await voiceService.createDraftFromAudio({
        tutorId: connection.tutorId,
        telegramId,
        chatId: String(ctx.chat.id),
        audio,
        mimeType,
      })
    }

    if (!render) {
      await ctx.reply('⚠️ Нет активного черновика. Отправьте голосовое сообщение заново.')
      return
    }

    // (5) Отправляем карточку.
    await sendRender(ctx, render)
  } catch (err) {
    console.error('[telegram] voice handler failed:', err)
    try {
      await ctx.reply(
        '⚠️ Не удалось обработать голосовое сообщение. Попробуйте ещё раз или добавьте урок в приложении.',
      )
    } catch {
      /* best-effort */
    }
  }
})

// ── Текстовое сообщение ────────────────────────────────────────────────────────
// Используется только для ввода значения при активном редактировании поля.
// Команды (начинаются с '/') игнорируем — их обрабатывают command-хендлеры выше.

bot?.on('text', async (ctx) => {
  const text = ctx.message.text
  if (text.startsWith('/')) return

  const telegramId = String(ctx.from.id)

  try {
    const editing = await voiceService.getActiveEditing(telegramId)
    if (!editing) {
      // Нет активного редактирования — лёгкая подсказка.
      await ctx.reply(
        '🎤 Чтобы добавить урок, пришлите голосовое сообщение. Команды: /menu, /help.',
      )
      return
    }

    const render = await voiceService.applyEditValue({ telegramId, text })
    if (render) {
      await sendRender(ctx, render)
    }
  } catch (err) {
    console.error('[telegram] text handler failed:', err)
  }
})

// ── Callback-кнопки карточки урока ──────────────────────────────────────────────

bot?.action(/^v:ok:(.+)$/, async (ctx) => {
  try {
    const render = await voiceService.confirmDraft(ctx.match[1]!)
    await editRender(ctx, render)
  } catch (err) {
    console.error('[telegram] v:ok failed:', err)
    try {
      await ctx.answerCbQuery('Ошибка')
    } catch {
      /* best-effort */
    }
  }
})

bot?.action(/^v:edit:(.+)$/, async (ctx) => {
  try {
    const render = await voiceService.openEditMenu(ctx.match[1]!)
    await editRender(ctx, render)
  } catch (err) {
    console.error('[telegram] v:edit failed:', err)
    try {
      await ctx.answerCbQuery('Ошибка')
    } catch {
      /* best-effort */
    }
  }
})

bot?.action(/^v:f:([^:]+):(\w+)$/, async (ctx) => {
  try {
    const render = await voiceService.startEditField(ctx.match[1]!, ctx.match[2]!)
    await editRender(ctx, render)
  } catch (err) {
    console.error('[telegram] v:f failed:', err)
    try {
      await ctx.answerCbQuery('Ошибка')
    } catch {
      /* best-effort */
    }
  }
})

bot?.action(/^v:back:(.+)$/, async (ctx) => {
  try {
    const render = await voiceService.getCardRender(ctx.match[1]!)
    await editRender(ctx, render)
  } catch (err) {
    console.error('[telegram] v:back failed:', err)
    try {
      await ctx.answerCbQuery('Ошибка')
    } catch {
      /* best-effort */
    }
  }
})

bot?.action(/^v:x:(.+)$/, async (ctx) => {
  try {
    const render = await voiceService.cancelDraft(ctx.match[1]!)
    await editRender(ctx, render)
  } catch (err) {
    console.error('[telegram] v:x failed:', err)
    try {
      await ctx.answerCbQuery('Ошибка')
    } catch {
      /* best-effort */
    }
  }
})

bot?.action(/^v:s:([^:]+):(.+)$/, async (ctx) => {
  try {
    const render = await voiceService.pickStudent(ctx.match[1]!, ctx.match[2]!)
    await editRender(ctx, render)
  } catch (err) {
    console.error('[telegram] v:s failed:', err)
    try {
      await ctx.answerCbQuery('Ошибка')
    } catch {
      /* best-effort */
    }
  }
})

// ── Публичные функции отправки сообщений ─────────────────────────────────────

export async function sendMessage(telegramId: string, text: string): Promise<void> {
  if (!bot) return
  try {
    await bot.telegram.sendMessage(telegramId, text, { parse_mode: 'Markdown' })
  } catch (err) {
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
    timezone?: string
  },
): Promise<void> {
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: opts.timezone ?? 'Europe/Moscow',
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
    timezone?: string
  },
): Promise<void> {
  await sendMessage(
    telegramId,
    `💳 *Напоминание об оплате*\n\n` +
      `Урок с *${opts.studentName}* завершён.\n` +
      `📚 Предмет: ${opts.subject}\n` +
      `💰 Сумма: ${opts.amount.toLocaleString('ru-RU')} ₽\n\n` +
      `Отметьте оплату в приложении Lessonify.`,
  )
}

export async function sendStudentLessonReminder(
  telegramId: string,
  opts: {
    tutorName: string
    subject: string
    startTime: Date
    timeLabel: string
    timezone?: string
  },
): Promise<void> {
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: opts.timezone ?? 'Europe/Moscow',
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
    timezone?: string
  },
): Promise<void> {
  const date = opts.startTime.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: opts.timezone ?? 'Europe/Moscow',
  })
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: opts.timezone ?? 'Europe/Moscow',
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
    timezone?: string
  },
): Promise<void> {
  const date = opts.startTime.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: opts.timezone ?? 'Europe/Moscow',
  })
  const time = opts.startTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: opts.timezone ?? 'Europe/Moscow',
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
