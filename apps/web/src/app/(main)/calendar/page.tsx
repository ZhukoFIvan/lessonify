'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, LayoutList, CalendarDays } from 'lucide-react'
import { DateStrip } from '@/components/calendar/date-strip'
import { MonthGrid } from '@/components/calendar/month-grid'
import { DayView } from '@/components/calendar/day-view'
import { MonthYearPicker } from '@/components/calendar/month-year-picker'
import { useCalendarDots, useDayView } from '@/hooks/use-calendar'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'

type ViewMode = 'strip' | 'grid'

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid'
    // На мобиле всегда grid
    if (window.innerWidth < 1024) return 'grid'
    return (localStorage.getItem('calendarViewMode') as ViewMode) ?? 'grid'
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      localStorage.setItem('calendarViewMode', viewMode)
    }
  }, [viewMode])

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const { counts, loading, refetch } = useCalendarDots(viewMonth, 45)
  const dayLessons = useDayView(selectedDate, counts)

  const monthKey = format(viewMonth, 'yyyy-MM')
  const monthLessonsCount = Array.from(counts.entries())
    .filter(([k]) => k.startsWith(monthKey))
    .reduce((sum, [, v]) => sum + v.length, 0)

  // Дни месяца, в которых есть уроки (для счётчика "активных дней")
  const activeDaysCount = Array.from(counts.entries())
    .filter(([k, v]) => k.startsWith(monthKey) && v.length > 0).length

  function handlePrevMonth() {
    const newMonth = subMonths(viewMonth, 1)
    setViewMonth(newMonth)
    setSelectedDate(startOfMonth(newMonth))
  }

  function handleNextMonth() {
    const newMonth = addMonths(viewMonth, 1)
    setViewMonth(newMonth)
    setSelectedDate(startOfMonth(newMonth))
  }

  function handleToday() {
    const today = new Date()
    setViewMonth(today)
    setSelectedDate(today)
  }

  const monthSubtitle =
    monthLessonsCount > 0
      ? `${monthLessonsCount} ${monthLessonsCount === 1 ? 'урок' : 'урока/уроков'}`
      : 'Нет уроков'

  // ── Шапка (общая для мобилы и десктопа) ──────────────────────────────────
  const header = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 lg:gap-3 min-w-0">
        {/* Навигация по месяцам */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Следующий месяц"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Название месяца с picker */}
        <MonthYearPicker
          value={viewMonth}
          onChange={(newDate) => {
            setViewMonth(newDate)
            setSelectedDate(newDate)
          }}
        >
          <button className="min-w-0 text-left transition-opacity hover:opacity-80">
            <h1 className="truncate text-xl font-bold capitalize tracking-tight text-foreground lg:text-h2">
              {format(viewMonth, 'LLLL yyyy', { locale: ru })}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">{monthSubtitle}</p>
          </button>
        </MonthYearPicker>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isToday(selectedDate) && (
          <button
            onClick={handleToday}
            className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Сегодня
          </button>
        )}

        {/* Переключатель режима — только на десктопе */}
        <button
          onClick={() => setViewMode(viewMode === 'strip' ? 'grid' : 'strip')}
          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label={viewMode === 'strip' ? 'Показать календарь' : 'Показать список'}
        >
          {viewMode === 'strip' ? <CalendarDays size={18} /> : <LayoutList size={18} />}
        </button>
      </div>
    </div>
  )

  // ── Выбор отображения сетки/полоски ──────────────────────────────────────
  const picker =
    viewMode === 'strip' ? (
      <DateStrip days={monthDays} selected={selectedDate} lessonCounts={counts} onSelect={setSelectedDate} />
    ) : (
      <MonthGrid days={monthDays} selected={selectedDate} lessonCounts={counts} onSelect={setSelectedDate} />
    )

  return (
    <div className="flex min-h-full flex-col lg:p-6 xl:p-8">
      {/* ───────────────── МОБИЛЬНАЯ РАСКЛАДКА (< lg) ───────────────── */}
      <div className="flex flex-col lg:hidden">
        <motion.div variants={fadeUp(0)} initial="hidden" animate="show" className="px-4 pb-1 pt-5">
          {header}
        </motion.div>

        <motion.div
          variants={fadeUp(0.08)}
          initial="hidden"
          animate="show"
          className={cn(
            'overflow-hidden border-b border-border/60',
            viewMode === 'strip'
              ? 'sticky top-0 z-10 bg-background pb-1 shadow-sm'
              : 'pb-2',
          )}
        >
          {picker}
        </motion.div>

        <motion.div variants={fadeUp(0.16)} initial="hidden" animate="show" className="flex-1 pt-3">
          <DayView date={selectedDate} lessons={dayLessons} loading={loading} onRefetch={refetch} />
        </motion.div>
      </div>

      {/* ───────────────── ДЕСКТОПНАЯ РАСКЛАДКА (lg+) ───────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:gap-6">
        <motion.div variants={fadeUp(0)} initial="hidden" animate="show">{header}</motion.div>

        <div className="grid flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] 2xl:grid-cols-[minmax(0,1fr)_480px]">
          {/* Календарь / список дат */}
          <motion.div
            variants={fadeUp(0.08)}
            initial="hidden"
            animate="show"
            className="surface-1 flex h-fit flex-col gap-3 rounded-xl p-5"
          >
            {picker}

            {/* Сводка по месяцу — заполняет низ карточки полезной плотностью */}
            <div className="mt-1 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
              <div className="rounded-md bg-surface-0 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Уроков в месяце
                </p>
                <p className="tnum mt-1 text-h3 text-foreground">{monthLessonsCount}</p>
              </div>
              <div className="rounded-md bg-surface-0 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Дней с уроками
                </p>
                <p className="tnum mt-1 text-h3 text-foreground">{activeDaysCount}</p>
              </div>
            </div>
          </motion.div>

          {/* Список выбранного дня */}
          <motion.div
            variants={fadeUp(0.16)}
            initial="hidden"
            animate="show"
            className="surface-1 flex h-fit min-h-full flex-col overflow-hidden rounded-xl"
          >
            <DayView date={selectedDate} lessons={dayLessons} loading={loading} onRefetch={refetch} dense />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
