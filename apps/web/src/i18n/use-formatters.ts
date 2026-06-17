'use client'

import { useLocale, useTranslations } from 'next-intl'
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'
import { getDateFnsLocale } from './date-locale'
import type { Locale } from './config'

export type PluralUnit = 'lessons' | 'students' | 'teachers'

// Единая точка локализованного форматирования дат, длительностей и числительных
// для клиентских компонентов. Берёт активную локаль из next-intl и подбирает
// объект локали date-fns + словарные строки (namespace `format`).
//
// Валюта (formatRub/formatCompact из @tutorflow/utils) сюда НЕ входит:
// рубли намеренно форматируются по-русски в любом языке интерфейса.
export function useFormatters() {
  const locale = useLocale() as Locale
  const t = useTranslations('format')
  const dateFnsLocale = getDateFnsLocale(locale)

  return {
    // Объект локали date-fns — для прямых вызовов format(...) в компонентах.
    dateFnsLocale,

    // «5 июня»
    date: (iso: string) => format(parseISO(iso), 'd MMMM', { locale: dateFnsLocale }),

    // «5 июня 2026»
    dateFull: (iso: string) => format(parseISO(iso), 'd MMMM yyyy', { locale: dateFnsLocale }),

    // «июн. 2026» — подпись месяца из строки YYYY-MM
    monthLabel: (yyyyMM: string) => {
      const [year, month] = yyyyMM.split('-')
      const d = new Date(Number(year), Number(month) - 1)
      return format(d, 'LLL yyyy', { locale: dateFnsLocale })
    },

    // «Сегодня» / «Завтра» / «Вчера» или дата
    lessonDate: (iso: string) => {
      const d = parseISO(iso)
      if (isToday(d)) return t('today')
      if (isTomorrow(d)) return t('tomorrow')
      if (isYesterday(d)) return t('yesterday')
      return format(d, 'd MMMM', { locale: dateFnsLocale })
    },

    // «30 мин» / «1 ч» / «1 ч 30 мин»
    duration: (minutes: number) => {
      if (minutes < 60) return t('duration.min', { m: minutes })
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m === 0 ? t('duration.hour', { h }) : t('duration.hourMin', { h, m })
    },

    // «3 урока» — ICU-плюрализация по активной локали
    count: (n: number, unit: PluralUnit) => t(`count.${unit}`, { count: n }),
  }
}
