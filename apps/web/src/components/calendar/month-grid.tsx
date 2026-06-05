'use client'

import { format, isToday, isSameDay, getDay, isSameMonth } from 'date-fns'
import { motion } from 'framer-motion'
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
    <div className="px-3 lg:px-0 py-1">
      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 mb-1.5">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={d}
            className={cn(
              'text-center text-[10px] font-semibold uppercase tracking-wider py-1',
              i >= 5 ? 'text-muted-foreground/60' : 'text-muted-foreground',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className="grid grid-cols-7 gap-1 lg:gap-1.5">
        {/* Пустые ячейки до первого дня месяца */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const isSelected = isSameDay(day, selected)
          const _isToday = isToday(day)
          const isWeekend = getDay(day) === 0 || getDay(day) === 6
          const lessons = lessonCounts.get(key) ?? []
          const hasLessons = lessons.length > 0
          const dotColors = lessons.slice(0, 4).map((l) => l.student?.color ?? '#6C63FF')
          const extra = lessons.length - dotColors.length

          return (
            <motion.button
              key={key}
              onClick={() => onSelect(day)}
              whileTap={{ scale: 0.94 }}
              aria-pressed={isSelected}
              aria-label={format(day, 'd MMMM yyyy')}
              className={cn(
                'group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md transition-all duration-150 lg:aspect-[1/0.82]',
                isSelected
                  ? 'brand-gradient text-white shadow-elevation-2 shadow-glow'
                  : _isToday
                    ? 'bg-primary/10 ring-1 ring-inset ring-primary/25 hover:bg-primary/15'
                    : 'hover:bg-surface-2 hover:shadow-elevation-1',
              )}
            >
              <span
                className={cn(
                  'tnum text-[13px] font-bold leading-none lg:text-sm',
                  isSelected
                    ? 'text-white'
                    : _isToday
                      ? 'text-primary'
                      : isWeekend
                        ? 'text-muted-foreground'
                        : 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Индикаторы уроков */}
              <div className="flex h-[6px] items-center justify-center gap-[3px]">
                {hasLessons ? (
                  <>
                    {dotColors.map((color, i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-[6px] w-[6px] rounded-full',
                          isSelected && 'ring-1 ring-white/40',
                        )}
                        style={{
                          backgroundColor: isSelected ? '#FFFFFF' : color,
                        }}
                      />
                    ))}
                    {extra > 0 && (
                      <span
                        className={cn(
                          'text-[9px] font-bold leading-none tnum',
                          isSelected ? 'text-white/80' : 'text-muted-foreground',
                        )}
                      >
                        +{extra}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="h-[6px] w-[6px]" />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
