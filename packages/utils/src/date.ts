import {
  format,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  addDays,
  isSameDay,
} from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'd MMMM', { locale: ru })
}

export function formatDateFull(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy', { locale: ru })
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'dd.MM.yyyy')
}

export function formatLessonDate(iso: string): string {
  const date = parseISO(iso)
  if (isToday(date)) return 'Сегодня'
  if (isTomorrow(date)) return 'Завтра'
  if (isYesterday(date)) return 'Вчера'
  return format(date, 'd MMMM', { locale: ru })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`
}

export function getLessonTimeRange(startIso: string, durationMinutes: number): string {
  const start = parseISO(startIso)
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
}

export function getMinutesUntil(iso: string): number {
  return differenceInMinutes(parseISO(iso), new Date())
}

export function getDayRange(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) }
}

export function getWeekDays(centerDate: Date, count = 14): Date[] {
  const start = addDays(centerDate, -3)
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

export function isSameDayStr(iso: string, date: Date): boolean {
  return isSameDay(parseISO(iso), date)
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return format(date, 'LLL yyyy', { locale: ru })
}
