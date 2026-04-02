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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
})

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

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between px-4 lg:px-0 pt-5 lg:pt-0 pb-1">
        <div className="flex items-center gap-3">
          {/* Навигация по месяцам */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
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
            <button className="text-left hover:opacity-80 transition-opacity">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight capitalize">
                {format(viewMonth, 'LLLL yyyy', { locale: ru })}
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                {monthLessonsCount > 0
                  ? `${monthLessonsCount} ${monthLessonsCount === 1 ? 'урок' : 'урока/уроков'}`
                  : 'Нет уроков'}
              </p>
            </button>
          </MonthYearPicker>

          {/* Переключатель режима — только на десктопе */}
          <button
            onClick={() => setViewMode(viewMode === 'strip' ? 'grid' : 'strip')}
            className="hidden lg:flex p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label={viewMode === 'strip' ? 'Показать календарь' : 'Показать список'}
          >
            {viewMode === 'strip' ? <CalendarDays size={18} /> : <LayoutList size={18} />}
          </button>
        </div>

        {!isToday(selectedDate) && (
          <button
            onClick={handleToday}
            className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            Сегодня
          </button>
        )}
      </motion.div>

      <motion.div {...fadeUp(0.08)} className={viewMode === 'strip' ? 'sticky top-0 bg-background z-10 border-b border-border/60 pb-1 shadow-sm lg:mt-4 overflow-hidden' : 'border-b border-border/60 pb-2 lg:mt-4 overflow-hidden'}>
        {viewMode === 'strip' ? (
          <DateStrip
            days={monthDays}
            selected={selectedDate}
            lessonCounts={counts}
            onSelect={setSelectedDate}
          />
        ) : (
          <MonthGrid
            days={monthDays}
            selected={selectedDate}
            lessonCounts={counts}
            onSelect={setSelectedDate}
          />
        )}
      </motion.div>

      <motion.div {...fadeUp(0.16)} className="flex-1 pt-3 lg:max-w-4xl lg:mx-auto lg:w-full">
        <DayView
          date={selectedDate}
          lessons={dayLessons}
          loading={loading}
          onRefetch={refetch}
        />
      </motion.div>
    </div>
  )
}
