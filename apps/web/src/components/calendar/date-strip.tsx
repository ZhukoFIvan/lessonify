'use client'

import { useEffect, useRef } from 'react'
import { format, isToday, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { LessonWithStudent } from '@tutorflow/types'

const DAY_ABBR = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

interface DateStripProps {
  days: Date[]
  selected: Date
  lessonCounts: Map<string, LessonWithStudent[]>
  onSelect: (date: Date) => void
}

export function DateStrip({ days, selected, lessonCounts, onSelect }: DateStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current
      const el = todayRef.current
      const offset = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className="scrollbar-hide flex overflow-x-auto px-3 py-2 lg:flex-wrap lg:justify-center lg:gap-0.5 lg:px-8"
      role="group"
      aria-label="Выбор даты"
    >
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd')
        const isSelected = isSameDay(day, selected)
        const _isToday = isToday(day)
        const lessons = lessonCounts.get(key) ?? []
        const dotCount = Math.min(lessons.length, 3)

        // Цвет кружков = цвета уроков (если у разных учеников разные цвета)
        const dotColors = lessons.slice(0, 3).map((l) => l.student.color ?? '#6C63FF')

        return (
          <button
            key={key}
            ref={_isToday ? todayRef : undefined}
            onClick={() => onSelect(day)}
            className="inline-flex min-w-[44px] flex-col items-center gap-1 whitespace-normal rounded-2xl px-2 py-1.5 transition-colors duration-100 active:scale-95 lg:flex"
            aria-pressed={isSelected}
            aria-label={format(day, 'd MMMM', { locale: ru })}
          >
            {/* День недели */}
            <span
              className={cn(
                'text-[10px] font-semibold uppercase leading-none tracking-wide',
                isSelected ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {DAY_ABBR[day.getDay()]}
            </span>

            {/* Кружок с датой */}
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-150',
                isSelected
                  ? 'bg-primary shadow-primary/30 text-white shadow-md'
                  : _isToday
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground',
              )}
            >
              {format(day, 'd')}
            </div>

            {/* Точки — количество уроков */}
            <div className="flex h-[6px] items-center gap-[3px]">
              {dotCount > 0
                ? dotColors.map((color, i) => (
                    <div
                      key={i}
                      className="h-[5px] w-[5px] rounded-full"
                      style={{
                        backgroundColor: isSelected ? 'white' : color,
                        opacity: isSelected ? 0.8 : 1,
                      }}
                    />
                  ))
                : null}
            </div>
          </button>
        )
      })}
    </div>
  )
}
