// Поддерживаемые языки интерфейса. ru — основной рынок и источник-словарь.
export const locales = ['ru', 'en', 'uk'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ru'

// Имя first-party куки, в которой живёт выбранный язык.
// Сервер читает её в getRequestConfig, клиентский переключатель — пишет.
// Не httpOnly: переключатель меняет её через document.cookie без серверного экшена.
export const LOCALE_COOKIE = 'lessonify-locale'

// Кука живёт год — выбор языка должен переживать перезаходы.
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

// Подписи языков на их собственном языке (для переключателя).
export const localeLabels: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  uk: 'Українська',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value)
}
