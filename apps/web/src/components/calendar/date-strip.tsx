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
      className="scrollbar-hide flex gap-1 overflow-x-auto px-3 py-2 lg:flex-wrap lg:justify-start lg:gap-1.5 lg:px-0"
      role="group"
      aria-label="Выбор даты"
    >
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd')
        const isSelected = isSameDay(day, selected)
        const _isToday = isToday(day)
        const lessons = lessonCounts.get(key) ?? []
        const hasLessons = lessons.length > 0

        // Цвет кружков = цвета уроков (если у разных учеников разные цвета)
        const dotColors = lessons.slice(0, 3).map((l) => l.student.color ?? '#6C63FF')

        return (
          <button
            key={key}
            ref={_isToday ? todayRef : undefined}
            onClick={() => onSelect(day)}
            className={cn(
              'group inline-flex w-[50px] shrink-0 flex-col items-center gap-1.5 rounded-lg px-1 py-2 transition-all duration-150 active:scale-[0.96] lg:w-[52px]',
              isSelected
                ? 'brand-gradient text-white shadow-elevation-2 shadow-glow'
                : _isToday
                  ? 'bg-primary/10 ring-1 ring-inset ring-primary/20'
                  : 'hover:bg-surface-2',
            )}
            aria-pressed={isSelected}
            aria-label={format(day, 'd MMMM', { locale: ru })}
          >
            {/* День недели */}
            <span
              className={cn(
                'text-[10px] font-semibold uppercase leading-none tracking-wide',
                isSelected
                  ? 'text-white/80'
                  : _isToday
                    ? 'text-primary'
                    : 'text-muted-foreground',
              )}
            >
              {DAY_ABBR[day.getDay()]}
            </span>

            {/* Дата */}
            <span
              className={cn(
                'tnum text-[17px] font-bold leading-none',
                isSelected
                  ? 'text-white'
                  : _isToday
                    ? 'text-primary'
                    : 'text-foreground',
              )}
            >
              {format(day, 'd')}
            </span>

            {/* Точки — количество уроков */}
            <div className="flex h-[6px] items-center justify-center gap-[3px]">
              {hasLessons
                ? dotColors.map((color, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-[6px] w-[6px] rounded-full',
                        isSelected && 'ring-1 ring-white/40',
                      )}
                      style={{ backgroundColor: isSelected ? '#FFFFFF' : color }}
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
