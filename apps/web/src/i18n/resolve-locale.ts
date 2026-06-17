import { defaultLocale, isLocale, type Locale } from './config'

// Разбирает заголовок Accept-Language ("ru-RU,ru;q=0.9,en;q=0.8")
// и возвращает первый поддерживаемый язык по убыванию веса q.
// Именно этот сигнал закрывает кейс «русский с VPN»: браузер шлёт ru
// независимо от страны выходного узла, потому что язык настроен в самом браузере.
export function matchAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null

  const ranked = header
    .split(',')
    .map((part) => {
      const segments = part.trim().split(';')
      const tag = (segments[0] ?? '').trim().toLowerCase()
      const base = tag.split('-')[0] ?? ''
      const qSegment = segments.find((s) => s.trim().startsWith('q='))
      const qValue = qSegment ? Number.parseFloat(qSegment.split('=')[1] ?? '') : 1
      return { base, quality: Number.isFinite(qValue) ? qValue : 1 }
    })
    .filter((entry) => entry.base.length > 0)
    .sort((a, b) => b.quality - a.quality)

  for (const entry of ranked) {
    if (isLocale(entry.base)) return entry.base
  }
  return null
}

// Приоритет выбора языка (Фаза 1):
//   1. явный выбор пользователя — кука (всегда главнее, в т.ч. для «русского с VPN»)
//   2. язык браузера — Accept-Language
//   3. дефолт — ru
// Сохранённое предпочтение из БД (User.locale) и гео по IP — отдельные, более поздние фазы;
// они встроятся выше Accept-Language, не ломая этот контракт.
export function resolveLocale(input: {
  cookie?: string | null
  acceptLanguage?: string | null
}): Locale {
  if (isLocale(input.cookie)) return input.cookie
  return matchAcceptLanguage(input.acceptLanguage) ?? defaultLocale
}
