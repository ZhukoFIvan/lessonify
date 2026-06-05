// ─────────────────────────────────────────────────────────────────────────────
// Voice-сервис: голосовая диктовка урока в Telegram.
//
// Поток: репетитор шлёт голос → Gemini распознаёт и парсит → создаём LessonDraft
// → карточка с кнопками подтверждения/правки → на подтверждение создаём урок
// через lessonsService.create (переиспользуем существующую логику + уведомления).
// ─────────────────────────────────────────────────────────────────────────────

import type { LessonDraft, LessonDraftStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { lessonsService } from '../lessons/lessons.service'
import { geminiService, GeminiConfigError } from './gemini.service'

// ── Публичный контракт рендера ─────────────────────────────────────────────────

export type DraftRender = {
  text: string
  keyboard?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> }
}

// ── Константы ──────────────────────────────────────────────────────────────────

const DRAFT_TTL_MS = 60 * 60 * 1000 // 1 час
const DEFAULT_TZ = 'Europe/Moscow'

const ACTIVE_STATUSES: LessonDraftStatus[] = [
  'AWAITING_CONFIRM',
  'EDITING_STUDENT',
  'EDITING_DATE',
  'EDITING_TIME',
  'EDITING_DURATION',
  'EDITING_PRICE',
  'EDITING_SUBJECT',
]

const EDITING_STATUSES: LessonDraftStatus[] = [
  'EDITING_STUDENT',
  'EDITING_DATE',
  'EDITING_TIME',
  'EDITING_DURATION',
  'EDITING_PRICE',
  'EDITING_SUBJECT',
]

type FieldCode = 'student' | 'date' | 'time' | 'dur' | 'price' | 'subj'

const FIELD_BY_STATUS: Record<string, FieldCode> = {
  EDITING_STUDENT: 'student',
  EDITING_DATE: 'date',
  EDITING_TIME: 'time',
  EDITING_DURATION: 'dur',
  EDITING_PRICE: 'price',
  EDITING_SUBJECT: 'subj',
}

const STATUS_BY_FIELD: Record<FieldCode, LessonDraftStatus> = {
  student: 'EDITING_STUDENT',
  date: 'EDITING_DATE',
  time: 'EDITING_TIME',
  dur: 'EDITING_DURATION',
  price: 'EDITING_PRICE',
  subj: 'EDITING_SUBJECT',
}

// ─────────────────────────────────────────────────────────────────────────────
// Часовой пояс: перевод настенного времени зоны в UTC через Intl-трюк.
// ─────────────────────────────────────────────────────────────────────────────

// Возвращает смещение зоны (в минутах) для заданного UTC-инстанта:
// сколько настенное время зоны опережает UTC в этот момент.
function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(instant)
  const get = (type: string): number => {
    const p = parts.find((x) => x.type === type)
    return p ? parseInt(p.value, 10) : 0
  }
  let hour = get('hour')
  if (hour === 24) hour = 0 // некоторые движки отдают '24' для полуночи
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
  return Math.round((asUTC - instant.getTime()) / 60000)
}

// Интерпретирует настенное время (год/месяц/день/час/минута) как время в зоне
// timeZone и возвращает корректный UTC-Date. Одна итерация коррекции смещения.
export function zonedWallTimeToUtc(
  year: number,
  month1to12: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  // Первое приближение — считаем, что настенное == UTC.
  const guess = new Date(Date.UTC(year, month1to12 - 1, day, hour, minute, 0))
  const offset = zoneOffsetMinutes(guess, timeZone)
  // Настоящий UTC = настенное-как-UTC минус смещение зоны.
  const corrected = new Date(guess.getTime() - offset * 60000)
  // Повторная проверка (для дат у границы перехода DST).
  const offset2 = zoneOffsetMinutes(corrected, timeZone)
  if (offset2 !== offset) {
    return new Date(guess.getTime() - offset2 * 60000)
  }
  return corrected
}

// ─────────────────────────────────────────────────────────────────────────────
// Форматирование для отображения (ru-RU в поясе репетитора).
// ─────────────────────────────────────────────────────────────────────────────

function formatDateLabel(date: Date, timeZone: string): string {
  // Пример: "6 июня (сб)"
  const day = date.toLocaleString('ru-RU', { timeZone, day: 'numeric' })
  const month = date.toLocaleString('ru-RU', { timeZone, month: 'long' })
  const weekday = date.toLocaleString('ru-RU', { timeZone, weekday: 'short' })
  return `${day} ${month} (${weekday})`
}

function formatTime(date: Date, timeZone: string): string {
  return date.toLocaleString('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatTimeRange(start: Date, durationMinutes: number | null, timeZone: string): string {
  const startLabel = formatTime(start, timeZone)
  if (!durationMinutes) return startLabel
  const end = new Date(start.getTime() + durationMinutes * 60000)
  return `${startLabel}–${formatTime(end, timeZone)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Доступ к данным.
// ─────────────────────────────────────────────────────────────────────────────

async function getTutorTimeZone(tutorId: string): Promise<string> {
  const tutor = await prisma.tutor.findUnique({
    where: { id: tutorId },
    select: { timezone: true },
  })
  return tutor?.timezone ?? DEFAULT_TZ
}

async function cancelActiveDrafts(telegramId: string): Promise<void> {
  await prisma.lessonDraft.updateMany({
    where: { telegramId, status: { in: ACTIVE_STATUSES } },
    data: { status: 'CANCELLED' },
  })
}

// Поиск ученика по имени (повторяет паттерн studentsService.list).
async function searchStudents(
  tutorId: string,
  name: string,
): Promise<Array<{ id: string; name: string; hourlyRate: number | null }>> {
  return prisma.student.findMany({
    where: { tutorId, name: { contains: name, mode: 'insensitive' } },
    select: { id: true, name: true, hourlyRate: true },
    orderBy: { name: 'asc' },
    take: 10,
  })
}

// Вычисляет цену из ставки ученика/репетитора, если она не названа.
async function computePrice(
  tutorId: string,
  studentId: string | null,
  durationMinutes: number | null,
): Promise<number | null> {
  if (!durationMinutes) return null

  let rate: number | null = null
  if (studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { hourlyRate: true },
    })
    rate = student?.hourlyRate ?? null
  }
  if (rate === null) {
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { hourlyRate: true },
    })
    rate = tutor?.hourlyRate ?? null
  }
  if (rate === null) return null

  return Math.round((rate * durationMinutes) / 60)
}

// ─────────────────────────────────────────────────────────────────────────────
// Вычисление startTime из date+time черновика.
// ─────────────────────────────────────────────────────────────────────────────

// В черновике startTime хранится как UTC DateTime. Но нам нужно держать
// date/time отдельно для редактирования. Решение: храним вычисленный UTC в
// startTime, а исходные date/time держим в transcript-независимых полях нельзя —
// поэтому реконструируем из startTime для дисплея, а при правке date/time
// пересобираем заново на основе уже известного startTime в поясе репетитора.

function wallPartsInZone(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number; hour: number; minute: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(date)
  const get = (type: string): number => {
    const p = parts.find((x) => x.type === type)
    return p ? parseInt(p.value, 10) : 0
  }
  let hour = get('hour')
  if (hour === 24) hour = 0
  return { year: get('year'), month: get('month'), day: get('day'), hour, minute: get('minute') }
}

function buildStartTime(
  date: string | null,
  time: string | null,
  timeZone: string,
): Date | null {
  if (!date || !time) return null
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const tm = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dm || !tm) return null
  const year = Number(dm[1])
  const month = Number(dm[2])
  const day = Number(dm[3])
  const hour = Number(tm[1])
  const minute = Number(tm[2])
  return zonedWallTimeToUtc(year, month, day, hour, minute, timeZone)
}

// ─────────────────────────────────────────────────────────────────────────────
// Рендеры.
// ─────────────────────────────────────────────────────────────────────────────

function cardKeyboard(draftId: string): NonNullable<DraftRender['keyboard']> {
  return {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить', callback_data: `v:ok:${draftId}` },
        { text: '✏️ Изменить', callback_data: `v:edit:${draftId}` },
      ],
      [{ text: '❌ Отмена', callback_data: `v:x:${draftId}` }],
    ],
  }
}

function editMenuKeyboard(draftId: string): NonNullable<DraftRender['keyboard']> {
  return {
    inline_keyboard: [
      [
        { text: 'Ученик', callback_data: `v:f:${draftId}:student` },
        { text: 'Дата', callback_data: `v:f:${draftId}:date` },
        { text: 'Время', callback_data: `v:f:${draftId}:time` },
      ],
      [
        { text: 'Длительность', callback_data: `v:f:${draftId}:dur` },
        { text: 'Цена', callback_data: `v:f:${draftId}:price` },
        { text: 'Предмет', callback_data: `v:f:${draftId}:subj` },
      ],
      [{ text: '⬅️ Назад', callback_data: `v:back:${draftId}` }],
    ],
  }
}

function buildCardText(draft: LessonDraft, timeZone: string): string {
  const lines: string[] = []

  if (draft.transcript) {
    lines.push(`🎤 Распознал: «${draft.transcript}»`)
    lines.push('')
  }
  lines.push('📝 Проверьте урок:')

  // Ученик
  if (draft.studentId && draft.studentName) {
    lines.push(`👤 Ученик: ${draft.studentName}`)
  } else if (draft.studentName) {
    lines.push(`👤 Ученик: ⚠️ «${draft.studentName}» не найден — нажмите Изменить`)
  } else {
    lines.push('👤 Ученик: ⚠️ не указан — нажмите Изменить')
  }

  // Предмет
  lines.push(draft.subject ? `📚 Предмет: ${draft.subject}` : '📚 Предмет: ⚠️ не указан')

  // Дата и время
  if (draft.startTime) {
    lines.push(`📅 ${formatDateLabel(draft.startTime, timeZone)}`)
    lines.push(`🕐 ${formatTimeRange(draft.startTime, draft.durationMinutes, timeZone)}`)
    if (draft.startTime.getTime() <= Date.now()) {
      lines.push('⚠️ Дата в прошлом — измените дату или время')
    }
  } else {
    lines.push('📅 ⚠️ дата/время не распознаны — нажмите Изменить')
  }

  // Цена
  lines.push(
    draft.price !== null && draft.price !== undefined
      ? `💰 ${draft.price.toLocaleString('ru-RU')} ₽`
      : '💰 ⚠️ цена не указана — нажмите Изменить',
  )

  return lines.join('\n')
}

function studentPickKeyboard(
  draftId: string,
  students: Array<{ id: string; name: string }>,
): NonNullable<DraftRender['keyboard']> {
  const rows = students.map((s) => [
    { text: s.name, callback_data: `v:s:${draftId}:${s.id}` },
  ])
  rows.push([{ text: '⬅️ Назад', callback_data: `v:back:${draftId}` }])
  return { inline_keyboard: rows }
}

// ─────────────────────────────────────────────────────────────────────────────
// Сервис.
// ─────────────────────────────────────────────────────────────────────────────

export const voiceService = {
  async createDraftFromAudio(input: {
    tutorId: string
    telegramId: string
    chatId: string
    audio: Buffer
    mimeType: string
  }): Promise<DraftRender> {
    const timeZone = await getTutorTimeZone(input.tutorId)

    // Имена учеников для подсказки модели.
    const students = await prisma.student.findMany({
      where: { tutorId: input.tutorId },
      select: { name: true },
      orderBy: { name: 'asc' },
      take: 200,
    })
    const studentNames = students.map((s) => s.name)

    let parsed
    try {
      parsed = await geminiService.parseLessonFromAudio({
        audio: input.audio,
        mimeType: input.mimeType,
        nowISO: new Date().toISOString(),
        timeZone,
        studentNames,
      })
    } catch (err) {
      if (err instanceof GeminiConfigError) {
        return {
          text: '⚠️ Распознавание голоса не настроено (нет ключа Gemini). Обратитесь к администратору.',
        }
      }
      return {
        text: '⚠️ Не удалось распознать голосовое сообщение. Попробуйте ещё раз или введите урок в приложении.',
      }
    }

    if (parsed.intent !== 'create_lesson') {
      return {
        text:
          `🎤 Распознал: «${parsed.transcript}»\n\n` +
          'Не понял, что нужно поставить урок. Скажите, например: «поставь Ане физику завтра в 5 на час».',
      }
    }

    // Снимаем прежние активные черновики — один активный на пользователя.
    await cancelActiveDrafts(input.telegramId)

    // Разрешаем ученика.
    let studentId: string | null = null
    let studentName = parsed.studentName
    let ambiguous: Array<{ id: string; name: string }> = []
    if (parsed.studentName) {
      const matches = await searchStudents(input.tutorId, parsed.studentName)
      if (matches.length === 1) {
        const m = matches[0]!
        studentId = m.id
        studentName = m.name
      } else if (matches.length > 1) {
        ambiguous = matches.map((m) => ({ id: m.id, name: m.name }))
      }
    }

    const startTime = buildStartTime(parsed.date, parsed.time, timeZone)
    const durationMinutes = parsed.durationMinutes ?? 60
    const price =
      parsed.price ?? (await computePrice(input.tutorId, studentId, durationMinutes))

    const draft = await prisma.lessonDraft.create({
      data: {
        tutorId: input.tutorId,
        telegramId: input.telegramId,
        chatId: input.chatId,
        status: 'AWAITING_CONFIRM',
        transcript: parsed.transcript,
        studentId,
        studentName: studentName ?? null,
        subject: parsed.subject,
        startTime,
        durationMinutes,
        price,
        expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
      },
    })

    // Если имя неоднозначно — сразу показываем выбор ученика.
    if (ambiguous.length > 1) {
      return {
        text:
          buildCardText(draft, timeZone) +
          `\n\nНайдено несколько учеников по запросу «${parsed.studentName}». Выберите нужного:`,
        keyboard: studentPickKeyboard(draft.id, ambiguous),
      }
    }

    return voiceService.getCardRender(draft.id)
  },

  async getActiveEditing(telegramId: string): Promise<{ draftId: string; field: string } | null> {
    const draft = await prisma.lessonDraft.findFirst({
      where: { telegramId, status: { in: EDITING_STATUSES } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, status: true },
    })
    if (!draft) return null
    const field = FIELD_BY_STATUS[draft.status]
    if (!field) return null
    return { draftId: draft.id, field }
  },

  async applyEditValue(input: {
    telegramId: string
    text?: string
    audio?: Buffer
    mimeType?: string
  }): Promise<DraftRender | null> {
    const draft = await prisma.lessonDraft.findFirst({
      where: { telegramId: input.telegramId, status: { in: EDITING_STATUSES } },
      orderBy: { updatedAt: 'desc' },
    })
    if (!draft) return null

    const field = FIELD_BY_STATUS[draft.status]
    if (!field) return null

    const timeZone = await getTutorTimeZone(draft.tutorId)

    // Получаем текст значения: из текста или из распознанного аудио.
    let valueText = input.text?.trim() ?? ''
    if (!valueText && input.audio && input.mimeType) {
      try {
        const parsed = await geminiService.parseLessonFromAudio({
          audio: input.audio,
          mimeType: input.mimeType,
          nowISO: new Date().toISOString(),
          timeZone,
          studentNames: [],
        })
        valueText = parsed.transcript.trim()
      } catch {
        return {
          text: '⚠️ Не удалось распознать голос. Введите значение текстом.',
        }
      }
    }

    if (!valueText) {
      return { text: '⚠️ Пустое значение. Введите текст или отправьте голосовое.' }
    }

    const data: {
      studentId?: string | null
      studentName?: string | null
      subject?: string
      startTime?: Date | null
      durationMinutes?: number
      price?: number
    } = {}

    switch (field) {
      case 'student': {
        const matches = await searchStudents(draft.tutorId, valueText)
        if (matches.length === 1) {
          data.studentId = matches[0]!.id
          data.studentName = matches[0]!.name
        } else if (matches.length > 1) {
          // Несколько совпадений — показываем выбор, статус не сбрасываем.
          await prisma.lessonDraft.update({
            where: { id: draft.id },
            data: { studentName: valueText, status: 'AWAITING_CONFIRM' },
          })
          return {
            text: `Найдено несколько учеников по запросу «${valueText}». Выберите нужного:`,
            keyboard: studentPickKeyboard(
              draft.id,
              matches.map((m) => ({ id: m.id, name: m.name })),
            ),
          }
        } else {
          // Не найден — сохраняем имя как есть, помечаем как неразрешённого.
          data.studentId = null
          data.studentName = valueText
        }
        break
      }
      case 'date': {
        const parsed = await geminiService.parseLessonFromText({
          text: valueText,
          nowISO: new Date().toISOString(),
          timeZone,
          studentNames: [],
        })
        if (!parsed.date) {
          return { text: '⚠️ Не понял дату. Скажите, например: «завтра» или «12 июня».' }
        }
        // Сохраняем время из текущего startTime (если было).
        const currentTime = draft.startTime
          ? formatTime(draft.startTime, timeZone)
          : (parsed.time ?? '12:00')
        data.startTime = buildStartTime(parsed.date, currentTime, timeZone)
        break
      }
      case 'time': {
        const parsed = await geminiService.parseLessonFromText({
          text: valueText,
          nowISO: new Date().toISOString(),
          timeZone,
          studentNames: [],
        })
        if (!parsed.time) {
          return { text: '⚠️ Не понял время. Скажите, например: «в 17:00» или «полпятого».' }
        }
        // Сохраняем дату из текущего startTime (если была), иначе из распознанной/сегодня.
        let dateStr: string | null = parsed.date
        if (draft.startTime) {
          const p = wallPartsInZone(draft.startTime, timeZone)
          dateStr = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
        }
        if (!dateStr) {
          return { text: '⚠️ Сначала укажите дату урока через «Изменить → Дата».' }
        }
        data.startTime = buildStartTime(dateStr, parsed.time, timeZone)
        break
      }
      case 'dur': {
        const n = parseIntFromText(valueText)
        if (n === null || n < 15 || n > 480) {
          return { text: '⚠️ Введите длительность в минутах (от 15 до 480), например «60».' }
        }
        data.durationMinutes = n
        break
      }
      case 'price': {
        const n = parseIntFromText(valueText)
        if (n === null || n < 0) {
          return { text: '⚠️ Введите цену в рублях целым числом, например «2000».' }
        }
        data.price = n
        break
      }
      case 'subj': {
        data.subject = valueText.slice(0, 100)
        break
      }
    }

    await prisma.lessonDraft.update({
      where: { id: draft.id },
      data: { ...data, status: 'AWAITING_CONFIRM' },
    })

    return voiceService.getCardRender(draft.id)
  },

  async getCardRender(draftId: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    const timeZone = await getTutorTimeZone(draft.tutorId)
    return {
      text: buildCardText(draft, timeZone),
      keyboard: cardKeyboard(draft.id),
    }
  },

  async openEditMenu(draftId: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    return {
      text: 'Что изменить?',
      keyboard: editMenuKeyboard(draft.id),
    }
  },

  async startEditField(draftId: string, fieldCode: string): Promise<DraftRender> {
    if (!isFieldCode(fieldCode)) {
      return { text: '⚠️ Неизвестное поле.' }
    }
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }

    await prisma.lessonDraft.update({
      where: { id: draftId },
      data: { status: STATUS_BY_FIELD[fieldCode] },
    })

    return {
      text: EDIT_PROMPTS[fieldCode],
      keyboard: {
        inline_keyboard: [[{ text: '⬅️ Назад', callback_data: `v:back:${draftId}` }]],
      },
    }
  },

  async pickStudent(draftId: string, studentId: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, tutorId: true, hourlyRate: true },
    })
    if (!student || student.tutorId !== draft.tutorId) {
      return { text: '⚠️ Ученик не найден.' }
    }

    // Если цена ещё не задана — пробуем пересчитать по ставке выбранного ученика.
    let price = draft.price
    if (price === null) {
      price = await computePrice(draft.tutorId, student.id, draft.durationMinutes)
    }

    await prisma.lessonDraft.update({
      where: { id: draftId },
      data: {
        studentId: student.id,
        studentName: student.name,
        price,
        status: 'AWAITING_CONFIRM',
      },
    })

    return voiceService.getCardRender(draftId)
  },

  async confirmDraft(draftId: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    if (draft.status === 'CONFIRMED' && draft.lessonId) {
      return { text: '✅ Этот урок уже создан.' }
    }

    const timeZone = await getTutorTimeZone(draft.tutorId)

    // Валидация.
    if (!draft.studentId) {
      return {
        text: '⚠️ Не выбран ученик. Нажмите «Изменить» → «Ученик», чтобы выбрать.',
        keyboard: cardKeyboard(draft.id),
      }
    }
    if (!draft.subject) {
      return {
        text: '⚠️ Не указан предмет. Нажмите «Изменить» → «Предмет».',
        keyboard: cardKeyboard(draft.id),
      }
    }
    if (!draft.startTime) {
      return {
        text: '⚠️ Не указаны дата и время. Нажмите «Изменить».',
        keyboard: cardKeyboard(draft.id),
      }
    }
    if (draft.startTime.getTime() <= Date.now()) {
      return {
        text: '⚠️ Урок не может быть в прошлом. Измените дату или время.',
        keyboard: cardKeyboard(draft.id),
      }
    }
    if (draft.price === null || draft.price === undefined) {
      return {
        text: '⚠️ Не указана цена — её нужно задать вручную. Нажмите «Изменить» → «Цена».',
        keyboard: cardKeyboard(draft.id),
      }
    }
    const durationMinutes = draft.durationMinutes ?? 60

    // Создаём урок через существующий сервис (он же шлёт уведомления).
    let lessonId: string
    try {
      const result = await lessonsService.create(draft.tutorId, {
        studentId: draft.studentId,
        subject: draft.subject,
        startTime: draft.startTime.toISOString(),
        durationMinutes,
        price: draft.price,
      })
      // create без repeat возвращает { data: lesson }.
      lessonId = (result as { data: { id: string } }).data.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать урок'
      return {
        text: `⚠️ ${message}`,
        keyboard: cardKeyboard(draft.id),
      }
    }

    await prisma.lessonDraft.update({
      where: { id: draftId },
      data: { status: 'CONFIRMED', lessonId },
    })

    const dateLabel = formatDateLabel(draft.startTime, timeZone)
    const timeLabel = formatTime(draft.startTime, timeZone)
    return {
      text: `✅ Урок создан: ${draft.studentName ?? 'ученик'} · ${draft.subject} · ${dateLabel} ${timeLabel}`,
    }
  },

  async cancelDraft(draftId: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '❌ Черновик отменён.' }
    }
    if (draft.status !== 'CONFIRMED') {
      await prisma.lessonDraft.update({
        where: { id: draftId },
        data: { status: 'CANCELLED' },
      })
    }
    return { text: '❌ Черновик отменён.' }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Вспомогательное.
// ─────────────────────────────────────────────────────────────────────────────

function isFieldCode(value: string): value is FieldCode {
  return value === 'student' ||
    value === 'date' ||
    value === 'time' ||
    value === 'dur' ||
    value === 'price' ||
    value === 'subj'
}

const EDIT_PROMPTS: Record<FieldCode, string> = {
  student: 'Введите имя ученика (текстом или голосом):',
  date: 'Введите дату урока (например, «завтра» или «12 июня»):',
  time: 'Введите время начала (например, «17:00» или «в пять»):',
  dur: 'Введите длительность в минутах (например, «60»):',
  price: 'Введите цену в рублях (например, «2000»):',
  subj: 'Введите предмет (например, «Физика»):',
}

// Извлекает целое число из текста: «две тысячи рублей» не разберём,
// но «2000», «90 минут», «1 час 30» — берём первое число.
function parseIntFromText(text: string): number | null {
  const m = text.replace(/\s+/g, ' ').match(/\d[\d\s]*/)
  if (!m) return null
  const n = parseInt(m[0].replace(/\s/g, ''), 10)
  return Number.isFinite(n) ? n : null
}
