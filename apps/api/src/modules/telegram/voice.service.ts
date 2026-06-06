// ─────────────────────────────────────────────────────────────────────────────
// Voice-сервис: голосовая диктовка урока в Telegram.
//
// Поток: репетитор шлёт голос → Gemini распознаёт и парсит → создаём LessonDraft
// → карточка с кнопками подтверждения/правки → на подтверждение создаём урок
// через lessonsService.create (переиспользуем существующую логику + уведомления).
// ─────────────────────────────────────────────────────────────────────────────

import type { LessonDraft, LessonDraftStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import {
  lessonsService,
  LessonConflictError,
  type LessonConflict,
} from '../lessons/lessons.service'
import { billingService } from '../billing/billing.service'
import { geminiService, GeminiConfigError } from './gemini.service'

// ── Публичный контракт рендера ─────────────────────────────────────────────────

export type DraftRender = {
  text: string
  keyboard?: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> }
}

// ── Константы ──────────────────────────────────────────────────────────────────

const DRAFT_TTL_MS = 60 * 60 * 1000 // 1 час
const DEFAULT_TZ = 'Europe/Moscow'

// STUB: рабочие часы репетитора для алгоритма альтернативных слотов.
// Пока захардкожены 09:00–21:00 в локальном поясе репетитора. Не используем
// AvailabilitySlot (другая семантика). TODO: вынести в профиль репетитора.
const WORK_START_HOUR = 9
const WORK_END_HOUR = 21

// Ограничения значений из Gemini (совпадают с ручной правкой).
const MIN_DURATION = 15
const MAX_DURATION = 480
const MIN_PRICE = 0
const MAX_PRICE = 100000

function clampDuration(n: number): number {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(n)))
}

function clampPrice(n: number): number {
  return Math.min(MAX_PRICE, Math.max(MIN_PRICE, Math.round(n)))
}

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
// Конфликты расписания: альтернативные слоты + карточка.
// ─────────────────────────────────────────────────────────────────────────────

function toUnixMinute(date: Date): number {
  return Math.floor(date.getTime() / 60000)
}

function localHour(date: Date, timeZone: string): number {
  return wallPartsInZone(date, timeZone).hour
}

function isWithinWorkHours(start: Date, durationMin: number, timeZone: string): boolean {
  const startHour = localHour(start, timeZone)
  // Конец урока должен укладываться в рабочий день: startHour ≥ 9 и
  // start + dur не позже 21:00. Считаем по настенному часу старта + длительность.
  if (startHour < WORK_START_HOUR) return false
  const p = wallPartsInZone(start, timeZone)
  const endMinutesOfDay = p.hour * 60 + p.minute + durationMin
  return endMinutesOfDay <= WORK_END_HOUR * 60
}

// Сдвигает UTC-инстант на N дней вперёд, СОХРАНЯЯ настенное время в поясе
// (через разбор настенных частей и пересборку) — устойчиво к DST.
function shiftWallDays(date: Date, days: number, timeZone: string): Date {
  const p = wallPartsInZone(date, timeZone)
  const base = new Date(Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0))
  const shifted = new Date(base.getTime() + days * 86400000)
  const sp = wallPartsInZone(shifted, timeZone)
  return zonedWallTimeToUtc(sp.year, sp.month, sp.day, p.hour, p.minute, timeZone)
}

// Предлагает до 3 свободных слотов, опираясь ТОЛЬКО на существующие уроки
// (без AvailabilitySlot), в пределах рабочих часов 09:00–21:00 tutor-local.
// Приоритет: (a) сразу после последнего конфликтующего урока в этот день,
// (b) до = desiredStart − duration, (c) то же настенное время завтра/послезавтра,
// (d) gap-fill по дню. Каждый кандидат валидируется через findConflicts.
async function suggestAlternativeSlots(
  tutorId: string,
  desiredStartUtc: Date,
  durationMin: number,
  timeZone: string,
  conflicts: LessonConflict[],
): Promise<Date[]> {
  const now = Date.now()
  const candidates: Date[] = []

  // (a) Сразу после последнего пересекающегося урока.
  if (conflicts.length > 0) {
    const maxEnd = conflicts.reduce(
      (acc, c) => (c.endUtc.getTime() > acc ? c.endUtc.getTime() : acc),
      0,
    )
    candidates.push(new Date(maxEnd))
  }

  // (b) До: desiredStart − duration.
  candidates.push(new Date(desiredStartUtc.getTime() - durationMin * 60000))

  // (c) То же настенное время завтра и послезавтра.
  candidates.push(shiftWallDays(desiredStartUtc, 1, timeZone))
  candidates.push(shiftWallDays(desiredStartUtc, 2, timeZone))

  // (d) Gap-fill по дню desiredStart: между концами уроков и рабочими границами.
  const dayLessons = await prisma.lesson.findMany({
    where: {
      tutorId,
      status: { in: ['SCHEDULED', 'RESCHEDULED'] },
      startTime: {
        gte: new Date(desiredStartUtc.getTime() - 12 * 3600000),
        lt: new Date(desiredStartUtc.getTime() + 12 * 3600000),
      },
    },
    select: { startTime: true, durationMinutes: true },
    orderBy: { startTime: 'asc' },
  })
  for (const l of dayLessons) {
    candidates.push(new Date(l.startTime.getTime() + l.durationMinutes * 60000))
  }

  // Валидация + дедуп.
  const out: Date[] = []
  const seen = new Set<number>()
  for (const cand of candidates) {
    if (out.length >= 3) break
    const unixMin = toUnixMinute(cand)
    if (seen.has(unixMin)) continue
    seen.add(unixMin)
    if (cand.getTime() <= now) continue
    if (!isWithinWorkHours(cand, durationMin, timeZone)) continue
    const c = await lessonsService.findConflicts(tutorId, cand, durationMin)
    if (c.length > 0) continue
    out.push(cand)
  }
  return out
}

function slotLabel(date: Date, timeZone: string, desiredUtc: Date): string {
  const time = formatTime(date, timeZone)
  // Если день отличается от желаемого — показываем дату.
  const dp = wallPartsInZone(desiredUtc, timeZone)
  const sp = wallPartsInZone(date, timeZone)
  const sameDay = dp.year === sp.year && dp.month === sp.month && dp.day === sp.day
  if (sameDay) {
    if (date.getTime() > desiredUtc.getTime()) {
      return `🕐 ${time} (сразу после)`
    }
    return `🕐 ${time} (до)`
  }
  const day = date.toLocaleString('ru-RU', { timeZone, day: 'numeric' })
  const month = date.toLocaleString('ru-RU', { timeZone, month: 'short' })
  return `📅 ${day} ${month}, ${time}`
}

// Карточка конфликта (founder decision 1: ТОЛЬКО слоты + «Другое время» + «Отмена»,
// никакого «Всё равно поставить»). Для дубля того же ученика — особый текст.
function buildConflictCard(
  draft: LessonDraft,
  conflicts: LessonConflict[],
  suggestions: Date[],
  timeZone: string,
  opts?: { toctou?: boolean },
): DraftRender {
  const lines: string[] = []

  if (opts?.toctou) {
    lines.push('⚠️ Пока вы подтверждали, это время заняли.')
    lines.push('')
  }

  const fmtConflict = (c: LessonConflict): string =>
    `${c.studentName} · ${c.subject} · ${formatTime(c.startUtc, timeZone)}–${formatTime(c.endUtc, timeZone)}`

  const sameStudentDup =
    draft.studentId !== null && conflicts.some((c) => c.studentId === draft.studentId)

  if (sameStudentDup) {
    const who = draft.studentName ?? 'ученика'
    lines.push(`🔁 У ${who} уже есть урок в это время.`)
    lines.push(`Это дубль? ${conflicts.map(fmtConflict).join('; ')}`)
  } else if (conflicts.length === 1) {
    lines.push(`⚠️ В это время уже занято: ${fmtConflict(conflicts[0]!)}.`)
    lines.push(`Куда поставить ${draft.studentName ?? 'урок'}?`)
  } else {
    lines.push(`⚠️ Пересекается с ${conflicts.length} уроками:`)
    lines.push(conflicts.map(fmtConflict).join('; '))
    lines.push(`Куда поставить ${draft.studentName ?? 'урок'}?`)
  }

  const desiredUtc = draft.startTime ?? new Date()
  const rows: Array<Array<{ text: string; callback_data: string }>> = []
  for (const slot of suggestions) {
    rows.push([
      {
        text: slotLabel(slot, timeZone, desiredUtc),
        callback_data: `v:slot:${draft.id}:${toUnixMinute(slot)}`,
      },
    ])
  }
  // «Другое время» переиспользует существующий flow правки времени.
  rows.push([{ text: '🔀 Другое время', callback_data: `v:f:${draft.id}:time` }])
  rows.push([{ text: '⬅️ Отмена', callback_data: `v:x:${draft.id}` }])

  if (suggestions.length === 0) {
    lines.push('')
    lines.push('Свободных слотов рядом не нашёл — выберите другое время.')
  }

  return { text: lines.join('\n'), keyboard: { inline_keyboard: rows } }
}

// Простая нормализация имени для fuzzy-сравнения (нижний регистр, ё→е, без пробелов).
function normName(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z]/g, '')
}

// Расстояние Левенштейна (ограниченное) для подбора похожих имён.
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]!
}

// Ищет похожих по имени учеников (для случая 0 точных совпадений).
async function findSimilarStudents(
  tutorId: string,
  rawName: string,
): Promise<Array<{ id: string; name: string }>> {
  const all = await prisma.student.findMany({
    where: { tutorId },
    select: { id: true, name: true },
    take: 200,
  })
  const target = normName(rawName)
  if (!target) return []
  // Короткие имена (Ян, Лев) дают ложные совпадения при d=2 — ужимаем порог.
  const maxDist = target.length < 4 ? 1 : 2
  const scored = all
    .map((s) => ({ s, d: levenshtein(target, normName(s.name)) }))
    .filter((x) => x.d <= maxDist)
    .sort((a, b) => a.d - b.d)
  return scored.slice(0, 3).map((x) => ({ id: x.s.id, name: x.s.name }))
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
    let similar: Array<{ id: string; name: string }> = []
    if (parsed.studentName) {
      const matches = await searchStudents(input.tutorId, parsed.studentName)
      if (matches.length === 1) {
        const m = matches[0]!
        studentId = m.id
        studentName = m.name
      } else if (matches.length > 1) {
        ambiguous = matches.map((m) => ({ id: m.id, name: m.name }))
      } else {
        // 0 точных совпадений — ищем похожих для защиты от дублей (decision 2).
        similar = await findSimilarStudents(input.tutorId, parsed.studentName)
      }
    }

    const startTime = buildStartTime(parsed.date, parsed.time, timeZone)
    // D5: клампим значения из Gemini в разумные границы.
    const durationMinutes = clampDuration(parsed.durationMinutes ?? 60)
    const rawPrice = parsed.price ?? (await computePrice(input.tutorId, studentId, durationMinutes))
    const price = rawPrice === null ? null : clampPrice(rawPrice)

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

    // E4 / decision 3: в одном сообщении несколько уроков — создаём первый,
    // честно просим остальные отдельным сообщением.
    const multiNote = parsed.multipleDetected
      ? '\n\nℹ️ Создам первый урок. Остальные продиктуйте отдельным сообщением.'
      : ''

    // Если имя неоднозначно — сразу показываем выбор ученика.
    if (ambiguous.length > 1) {
      return {
        text:
          buildCardText(draft, timeZone) +
          `\n\nНайдено несколько учеников по запросу «${parsed.studentName}». Выберите нужного:` +
          multiNote,
        keyboard: studentPickKeyboard(draft.id, ambiguous),
      }
    }

    // Имя названо, но в ростере не найдено (0 совпадений) — предлагаем
    // похожих + кнопку создать нового (decision 2).
    if (parsed.studentName && !studentId) {
      const rows: Array<Array<{ text: string; callback_data: string }>> = []
      for (const s of similar) {
        rows.push([{ text: `Похоже на: ${s.name}?`, callback_data: `v:s:${draft.id}:${s.id}` }])
      }
      rows.push([
        { text: `➕ Создать «${parsed.studentName}»`, callback_data: `v:newstud:${draft.id}` },
      ])
      rows.push([{ text: '✏️ Изменить', callback_data: `v:edit:${draft.id}` }])
      rows.push([{ text: '❌ Отмена', callback_data: `v:x:${draft.id}` }])
      const head = similar.length > 0 ? 'Не нашёл точного совпадения. Возможно, это:' : ''
      return {
        text:
          buildCardText(draft, timeZone) +
          (head ? `\n\n${head}` : `\n\nУченик «${parsed.studentName}» не найден в списке.`) +
          multiNote,
        keyboard: { inline_keyboard: rows },
      }
    }

    if (multiNote) {
      const base = await voiceService.getCardRender(draft.id)
      return { ...base, text: base.text + multiNote }
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
    if (isExpired(draft)) return EXPIRED_RENDER

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
        if (n === null || n < 0 || n > MAX_PRICE) {
          return { text: '⚠️ Введите цену в рублях целым числом (0–100000), например «2000».' }
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

  async getCardRender(draftId: string, telegramId?: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
    }
    if (isExpired(draft)) return EXPIRED_RENDER
    const timeZone = await getTutorTimeZone(draft.tutorId)

    // ADVISORY-проверка пересечений: если есть конфликт — показываем
    // конфликт-карточку вместо обычной (founder decision 1: жёсткая блокировка).
    if (draft.studentId && draft.startTime && draft.startTime.getTime() > Date.now()) {
      const durationMin = draft.durationMinutes ?? 60
      const conflicts = await lessonsService.findConflicts(
        draft.tutorId,
        draft.startTime,
        durationMin,
      )
      if (conflicts.length > 0) {
        const suggestions = await suggestAlternativeSlots(
          draft.tutorId,
          draft.startTime,
          durationMin,
          timeZone,
          conflicts,
        )
        return buildConflictCard(draft, conflicts, suggestions, timeZone)
      }
    }

    return {
      text: buildCardText(draft, timeZone),
      keyboard: cardKeyboard(draft.id),
    }
  },

  async openEditMenu(draftId: string, telegramId?: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
    }
    if (isExpired(draft)) return EXPIRED_RENDER
    return {
      text: 'Что изменить?',
      keyboard: editMenuKeyboard(draft.id),
    }
  },

  async startEditField(draftId: string, fieldCode: string, telegramId?: string): Promise<DraftRender> {
    if (!isFieldCode(fieldCode)) {
      return { text: '⚠️ Неизвестное поле.' }
    }
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
    }
    if (isExpired(draft)) return EXPIRED_RENDER

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

  async pickStudent(draftId: string, studentId: string, telegramId?: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
    }
    if (isExpired(draft)) return EXPIRED_RENDER

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

  async confirmDraft(draftId: string, telegramId?: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    // F6: чужой черновик (групповой чат).
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
    }
    if (draft.status === 'CONFIRMED' && draft.lessonId) {
      return { text: '✅ Этот урок уже создан.' }
    }
    if (isExpired(draft)) return EXPIRED_RENDER

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
    if (draft.price === null || draft.price === undefined) {
      return {
        text: '⚠️ Не указана цена — её нужно задать вручную. Нажмите «Изменить» → «Цена».',
        keyboard: cardKeyboard(draft.id),
      }
    }
    const durationMinutes = draft.durationMinutes ?? 60

    // ── C3 / founder decision 4: прошедшее время ──────────────────────────────
    // Различаем: «дата сегодня, но время прошло» → предлагаем завтра;
    // «явная прошлая дата» → создаём как проведённый (COMPLETED).
    let lessonStatus: 'COMPLETED' | undefined
    if (draft.startTime.getTime() <= Date.now()) {
      const decision = classifyPast(draft.startTime, timeZone)
      if (decision === 'today') {
        const tomorrow = shiftWallDays(draft.startTime, 1, timeZone)
        return {
          text:
            '🕐 Это время сегодня уже прошло. Поставить на завтра в то же время?',
          keyboard: {
            inline_keyboard: [
              [
                {
                  text: `📅 Завтра ${formatTime(tomorrow, timeZone)}`,
                  callback_data: `v:slot:${draft.id}:${toUnixMinute(tomorrow)}`,
                },
              ],
              [{ text: '🔀 Другое время', callback_data: `v:f:${draft.id}:time` }],
              [{ text: '⬅️ Отмена', callback_data: `v:x:${draft.id}` }],
            ],
          },
        }
      }
      // Явная прошлая дата — фиксируем как проведённый урок (учёт дохода).
      lessonStatus = 'COMPLETED'
    }

    // F5: атомарно «застолбить» черновик, чтобы двойной тап не создал 2 урока.
    const claim = await prisma.lessonDraft.updateMany({
      where: { id: draftId, status: { not: 'CONFIRMED' } },
      data: { status: 'CONFIRMED' },
    })
    if (claim.count === 0) {
      return { text: '✅ Этот урок уже создан.' }
    }

    // Создаём урок через существующий сервис (он же шлёт уведомления).
    let lessonId: string
    try {
      const result = await lessonsService.create(draft.tutorId, {
        studentId: draft.studentId,
        subject: draft.subject,
        startTime: draft.startTime.toISOString(),
        durationMinutes,
        price: draft.price,
        ...(lessonStatus ? { status: lessonStatus } : {}),
      })
      // create без repeat возвращает { data: lesson }.
      lessonId = (result as { data: { id: string } }).data.id
    } catch (err) {
      // Откатываем claim, чтобы можно было повторить попытку.
      await prisma.lessonDraft
        .update({ where: { id: draftId }, data: { status: 'AWAITING_CONFIRM' } })
        .catch(() => undefined)

      // A6 TOCTOU: время заняли пока подтверждали — показываем конфликт-карточку.
      if (err instanceof LessonConflictError) {
        const suggestions = await suggestAlternativeSlots(
          draft.tutorId,
          draft.startTime,
          durationMinutes,
          timeZone,
          err.conflicts,
        )
        return buildConflictCard(draft, err.conflicts, suggestions, timeZone, {
          toctou: true,
        })
      }

      const message = err instanceof Error ? err.message : 'Не удалось создать урок'
      return {
        text: `⚠️ ${message}`,
        keyboard: cardKeyboard(draft.id),
      }
    }

    await prisma.lessonDraft.update({
      where: { id: draftId },
      data: { lessonId },
    })

    const dateLabel = formatDateLabel(draft.startTime, timeZone)
    const timeLabel = formatTime(draft.startTime, timeZone)
    const head = lessonStatus === 'COMPLETED' ? '✅ Записал как проведённый урок' : '✅ Урок создан'
    return {
      text: `${head}: ${draft.studentName ?? 'ученик'} · ${draft.subject} · ${dateLabel} ${timeLabel}`,
    }
  },

  // pickSlot: выбор альтернативного слота из конфликт-карточки (или «завтра»).
  async pickSlot(draftId: string, unixMinuteUtc: number, telegramId?: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
    }
    if (isExpired(draft)) return EXPIRED_RENDER

    const timeZone = await getTutorTimeZone(draft.tutorId)
    const newStart = new Date(unixMinuteUtc * 60000)
    const durationMin = draft.durationMinutes ?? 60

    // Защита от подделанного callback_data: слот обязан быть в будущем и в рабочих
    // часах. Иначе крафтнутая кнопка могла бы записать урок задним числом.
    if (newStart.getTime() <= Date.now() || !isWithinWorkHours(newStart, durationMin, timeZone)) {
      return {
        text: '⚠️ Этот вариант больше недоступен. Нажмите «Изменить» → «Время», чтобы выбрать другое.',
      }
    }

    // Перепроверяем, что слот всё ещё свободен.
    const conflicts = await lessonsService.findConflicts(draft.tutorId, newStart, durationMin)
    if (conflicts.length > 0) {
      const suggestions = await suggestAlternativeSlots(
        draft.tutorId,
        newStart,
        durationMin,
        timeZone,
        conflicts,
      )
      const refreshed = { ...draft, startTime: newStart }
      return buildConflictCard(refreshed, conflicts, suggestions, timeZone, {
        toctou: true,
      })
    }

    await prisma.lessonDraft.update({
      where: { id: draftId },
      data: { startTime: newStart, status: 'AWAITING_CONFIRM' },
    })
    return voiceService.getCardRender(draftId)
  },

  // B1 / G1: создать нового ученика из черновика (0 точных совпадений).
  async createStudentForDraft(draftId: string, telegramId?: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '⚠️ Черновик не найден или устарел. Отправьте голосовое сообщение заново.' }
    }
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
    }
    if (isExpired(draft)) return EXPIRED_RENDER
    const name = draft.studentName?.trim()
    if (!name) {
      return { text: '⚠️ Имя ученика не распознано. Нажмите «Изменить» → «Ученик».' }
    }

    // G1: лимит FREE-плана.
    try {
      await billingService.checkStudentLimit(draft.tutorId)
    } catch {
      return {
        text:
          `🔒 На бесплатном тарифе можно добавить до 5 учеников. ` +
          `Чтобы добавить «${name}» — оформите PRO в приложении. ` +
          `Либо выберите существующего ученика через «Изменить» → «Ученик».`,
        keyboard: cardKeyboard(draft.id),
      }
    }

    const student = await prisma.student.create({
      data: { tutorId: draft.tutorId, name },
      select: { id: true, name: true, hourlyRate: true },
    })

    // Цена по ставке нового ученика, если ещё не задана.
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

  async cancelDraft(draftId: string, telegramId?: string): Promise<DraftRender> {
    const draft = await prisma.lessonDraft.findUnique({ where: { id: draftId } })
    if (!draft) {
      return { text: '❌ Черновик отменён.' }
    }
    if (telegramId && draft.telegramId !== telegramId) {
      return { text: '⚠️ Это не ваш черновик урока.' }
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

// C3: классификация прошедшего времени.
// 'today'  — настенная дата урока == сегодня (прошло только время) → предлагаем завтра.
// 'past'   — настенная дата строго раньше сегодняшней → фиксируем как проведённый.
function classifyPast(startTime: Date, timeZone: string): 'today' | 'past' {
  const lesson = wallPartsInZone(startTime, timeZone)
  const now = wallPartsInZone(new Date(), timeZone)
  if (lesson.year === now.year && lesson.month === now.month && lesson.day === now.day) {
    return 'today'
  }
  return 'past'
}

// F2: черновик истёк (TTL 1ч).
function isExpired(draft: { expiresAt: Date; status: LessonDraftStatus }): boolean {
  if (draft.status === 'CONFIRMED' || draft.status === 'CANCELLED') return false
  return draft.expiresAt.getTime() < Date.now()
}

const EXPIRED_RENDER: DraftRender = {
  text: '⏳ Черновик устарел (прошёл час). Продиктуйте урок заново.',
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
