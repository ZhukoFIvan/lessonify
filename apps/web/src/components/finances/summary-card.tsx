'use client'

import { TrendingUp, Clock, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatNumber } from '@/components/ui/stat'
import { formatRub, pluralize } from '@tutorflow/utils'
import type { PaymentSummary } from '@tutorflow/types'

interface SummaryCardProps {
  summary: PaymentSummary | null
  loading: boolean
}

export function SummaryCard({ summary, loading }: SummaryCardProps) {
  if (loading) return <Skeleton className="h-[176px] rounded-xl" />

  const total = (summary?.totalEarned ?? 0) + (summary?.totalPending ?? 0)
  const earned = summary?.totalEarned ?? 0
  const pending = summary?.totalPending ?? 0
  const lessonsCount = summary?.lessonsCount ?? 0
  const paidCount = summary?.paidLessonsCount ?? 0

  // Progress bar: earned / total
  const progress = total > 0 ? Math.round((earned / total) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-xl brand-gradient p-5 text-white shadow-elevation-2 lg:p-6">
      {/* Декоративное свечение */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl"
      />

      <div className="relative">
        {/* Заголовок */}
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15">
            <TrendingUp size={15} />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">
            Доход за месяц
          </p>
        </div>

        {/* Основная сумма — hero-число */}
        <div className="mt-3">
          <StatNumber
            value={new Intl.NumberFormat('ru-RU').format(earned)}
            unit="₽"
            size="hero"
            className="text-white [&_.hero-unit]:text-white/70"
          />
          <p className="mt-1 text-xs text-white/70">
            получено из <span className="tnum font-medium text-white/90">{formatRub(total)}</span>
          </p>
        </div>

        {/* Прогресс-бар */}
        <div className="mt-4 mb-4 h-2 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Нижняя строка */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-white/70" />
            <span className="text-xs text-white/85">
              <span className="tnum font-semibold text-white">{formatRub(pending)}</span> ожидает
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-white/70" />
            <span className="text-xs text-white/85">
              <span className="tnum font-semibold text-white">
                {paidCount}/{lessonsCount}
              </span>{' '}
              {pluralize(lessonsCount, ['урок', 'урока', 'уроков'])}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
