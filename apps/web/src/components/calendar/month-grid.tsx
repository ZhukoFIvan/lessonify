'use client'

import { format, isToday, isSameDay, getDay } from 'date-fns'
import { cn } from '@/lib/utils'
import type { LessonWithStudent } from '@tutorflow/types'

// Неделя начинается с Пн (российский стандарт)
const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface MonthGridProps {
  days: Date[]
  selected: Date
  lessonCounts: Map<string, LessonWithStudent[]>
  onSelect: (date: Date) => void
}

export function MonthGrid({ days, selected, lessonCounts, onSelect }: MonthGridProps) {
  const firstDay = days[0]!
  // Смещение: (0=Вс → 6, 1=Пн → 0, 2=Вт → 1, ...)
  const offset = (getDay(firstDay) + 6) % 7

  return (
    <div className="px-3 lg:px-8 py-2">
      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Пустые ячейки до первого дня месяца */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const isSelected = isSameDay(day, selected)
          const _isToday = isToday(day)
          const lessons = lessonCounts.get(key) ?? []
          const dotColors = lessons.slice(0, 3).map((l) => l.student?.color ?? '#6C63FF')

          return (
            <button
              key={key}
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={format(day, 'd MMMM yyyy')}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-h-[44px] rounded-xl transition-colors active:scale-95',
                isSelected
                  ? 'bg-primary shadow-md shadow-primary/30'
                  : _isToday
                    ? 'bg-primary/10'
                    : 'hover:bg-secondary',
              )}
            >
              <span
                className={cn(
                  'text-sm font-bold leading-none',
                  isSelected
                    ? 'text-white'
                    : _isToday
                      ? 'text-primary'
                      : 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Точки уроков */}
              <div className="flex gap-[3px] h-[5px] items-center">
                {dotColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-[4px] h-[4px] rounded-full"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.75)' : color,
                    }}
                  />
                ))}
                {dotColors.length === 0 && <div className="w-[4px] h-[4px]" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
