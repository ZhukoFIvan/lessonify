// ─────────────────────────────────────────────────────────────────────────────
// Gemini-сервис: распознавание и парсинг урока из голоса/текста.
//
// Без SDK — общаемся с REST API через глобальный fetch (Node 22).
// Модель возвращает строго заданный JSON (responseSchema), который мы валидируем
// и нормализуем в LessonParseResult.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ── Ошибки ────────────────────────────────────────────────────────────────────

export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeminiConfigError'
  }
}

export class GeminiRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeminiRequestError'
  }
}

// ── Типы ──────────────────────────────────────────────────────────────────────

export type LessonIntent = 'create_lesson' | 'unknown'

export interface LessonParseResult {
  transcript: string
  intent: LessonIntent
  studentName: string | null
  date: string | null // 'YYYY-MM-DD'
  time: string | null // 'HH:mm' (24h)
  durationMinutes: number | null
  price: number | null
  subject: string | null
}

interface ParseAudioInput {
  audio: Buffer
  mimeType: string
  nowISO: string
  timeZone: string
  studentNames: string[]
}

interface ParseTextInput {
  text: string
  nowISO: string
  timeZone: string
  studentNames: string[]
}

// ── Gemini wire-формат (то, что реально шлём/получаем) ──────────────────────────

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

interface GeminiContent {
  parts: GeminiPart[]
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
}

// responseSchema — описываем форму JSON, который должна вернуть модель.
// ВАЖНО: REST-API Gemini ожидает значения `type` в ВЕРХНЕМ регистре
// (proto-enum: OBJECT/STRING/INTEGER/...). Нижний регистр → HTTP 400.
const responseSchema = {
  type: 'OBJECT',
  properties: {
    transcript: { type: 'STRING' },
    intent: { type: 'STRING', enum: ['create_lesson', 'unknown'] },
    studentName: { type: 'STRING', nullable: true },
    date: { type: 'STRING', nullable: true },
    time: { type: 'STRING', nullable: true },
    durationMinutes: { type: 'INTEGER', nullable: true },
    price: { type: 'INTEGER', nullable: true },
    subject: { type: 'STRING', nullable: true },
  },
  required: ['transcript', 'intent'],
} as const

// ── Промпт ─────────────────────────────────────────────────────────────────────

function buildPrompt(opts: { nowISO: string; timeZone: string; studentNames: string[] }): string {
  const names =
    opts.studentNames.length > 0
      ? opts.studentNames.map((n) => `«${n}»`).join(', ')
      : '(список пуст)'

  // Локальное «сейчас» в поясе репетитора — чтобы «сегодня/завтра» резолвились
  // относительно ЕГО местной даты, а не UTC (важно вблизи полуночи).
  let localNow = opts.nowISO
  try {
    localNow = new Date(opts.nowISO).toLocaleString('ru-RU', {
      timeZone: opts.timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    /* оставляем ISO как есть */
  }

  return [
    'Ты — ассистент репетитора. На вход подаётся голосовое сообщение или текст, в котором',
    'репетитор диктует, какой урок поставить ученику. Извлеки данные урока.',
    '',
    `Сейчас по местному времени репетитора (пояс ${opts.timeZone}): ${localNow}.`,
    'Разрешай относительные даты ("сегодня", "завтра", "послезавтра", "в следующий вторник",',
    '"через неделю" и т.п.) относительно ЭТОГО местного момента.',
    '',
    'Правила вывода:',
    '- transcript: дословная расшифровка сказанного (или исходный текст).',
    '- intent: "create_lesson", если это про назначение урока; иначе "unknown".',
    `- studentName: имя ученика как названо. Сопоставь с существующими учениками: ${names}.`,
    '  Если совпадает по смыслу — верни ИМЯ ИЗ СПИСКА. Если нет — верни как услышал. Если не названо — null.',
    '- date: дата урока в формате "YYYY-MM-DD" или null.',
    '- time: время начала в 24-часовом формате "HH:mm" (например, "17:00") или null.',
    '  "в 5" вечером трактуй как 17:00, утром — 09:00; ориентируйся на контекст, по умолчанию — дневное/вечернее время.',
    '- durationMinutes: длительность в минутах ("на час" = 60, "полтора часа" = 90, "45 минут" = 45) или null.',
    '- price: цена в рублях целым числом, если названа ("за 2000", "две тысячи") или null.',
    '- subject: предмет ("физика", "английский") с заглавной буквы или null.',
    '',
    'Верни ТОЛЬКО JSON указанной структуры, без пояснений.',
  ].join('\n')
}

// ── Низкоуровневый вызов ───────────────────────────────────────────────────────

async function callGemini(content: GeminiContent): Promise<GeminiResponse> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new GeminiConfigError('GEMINI_API_KEY not set')
  }
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${key}`

  const body = {
    contents: [content],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0,
    },
  }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new GeminiRequestError(
      `Не удалось связаться с Gemini: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new GeminiRequestError(`Gemini вернул ${res.status}: ${detail.slice(0, 500)}`)
  }

  return (await res.json()) as GeminiResponse
}

// ── Разбор ответа ──────────────────────────────────────────────────────────────

function extractJsonText(resp: GeminiResponse): string {
  const text = resp.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new GeminiRequestError('Пустой ответ от Gemini')
  }
  return text
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const n = Math.round(value)
    return n > 0 ? n : null
  }
  if (typeof value === 'string') {
    const n = parseInt(value.replace(/[^\d]/g, ''), 10)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return null
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/

function normalizeResult(raw: unknown): LessonParseResult {
  const obj = (raw ?? {}) as Record<string, unknown>

  const intent: LessonIntent = obj.intent === 'create_lesson' ? 'create_lesson' : 'unknown'

  const dateRaw = asNonEmptyString(obj.date)
  const date = dateRaw && DATE_RE.test(dateRaw) ? dateRaw : null

  let time = asNonEmptyString(obj.time)
  if (time) {
    // Приводим "9:00" → "09:00".
    const [h, m] = time.split(':')
    if (h !== undefined && m !== undefined) {
      time = `${h.padStart(2, '0')}:${m}`
    }
    if (!TIME_RE.test(time)) time = null
  }

  return {
    transcript: asNonEmptyString(obj.transcript) ?? '',
    intent,
    studentName: asNonEmptyString(obj.studentName),
    date,
    time,
    durationMinutes: asPositiveInt(obj.durationMinutes),
    price:
      typeof obj.price === 'number' && Number.isFinite(obj.price) && obj.price >= 0
        ? Math.round(obj.price)
        : asPositiveInt(obj.price),
    subject: asNonEmptyString(obj.subject),
  }
}

function parseJsonText(jsonText: string): LessonParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new GeminiRequestError('Gemini вернул некорректный JSON')
  }
  return normalizeResult(parsed)
}

// ── Публичное API ──────────────────────────────────────────────────────────────

export const geminiService = {
  async parseLessonFromAudio(input: ParseAudioInput): Promise<LessonParseResult> {
    const prompt = buildPrompt(input)
    const resp = await callGemini({
      parts: [
        { inline_data: { mime_type: input.mimeType, data: input.audio.toString('base64') } },
        { text: prompt },
      ],
    })
    return parseJsonText(extractJsonText(resp))
  },

  async parseLessonFromText(input: ParseTextInput): Promise<LessonParseResult> {
    const prompt = buildPrompt(input)
    const resp = await callGemini({
      parts: [{ text: `${prompt}\n\nТекст:\n${input.text}` }],
    })
    return parseJsonText(extractJsonText(resp))
  },
}
