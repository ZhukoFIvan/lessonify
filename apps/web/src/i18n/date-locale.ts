import { enUS, ru, uk } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'
import type { Locale } from './config'

// Соответствие наших локалей объектам локали date-fns.
const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = {
  ru,
  en: enUS,
  uk,
}

export function getDateFnsLocale(locale: Locale): DateFnsLocale {
  return DATE_FNS_LOCALES[locale]
}
