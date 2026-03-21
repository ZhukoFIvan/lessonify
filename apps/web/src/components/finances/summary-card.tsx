'use client'

import { TrendingUp, Clock, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRub, pluralize } from '@tutorflow/utils'
import type { PaymentSummary } from '@tutorflow/types'

interface SummaryCardProps {
  summary: PaymentSummary | null
  loading: boolean
}

export function SummaryCard({ summary, loading }: SummaryCardProps) {
  if (loading) return <Skeleton className="h-[140px] rounded-2xl" />

  const total = (summary?.totalEarned ?? 0) + (summary?.totalPending ?? 0)
  const earned = summary?.totalEarned ?? 0
  const pending = summary?.totalPending ?? 0
  const lessonsCount = summary?.lessonsCount ?? 0
  const paidCount = summary?.paidLessonsCount ?? 0

  // Progress bar: earned / total
  const progress = total > 0 ? Math.round((earned / total) * 100) : 0

  return (
    <div className="rounded-2xl bg-primary p-5 text-white shadow-lg shadow-primary/30">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={16} className="opacity-80" />
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Этот месяц</p>
      </div>

      {/* Основная сумма */}
      <p className="text-3xl font-bold tracking-tight mb-0.5">{formatRub(earned)}</p>
      <p className="text-xs opacity-70">получено из {formatRub(total)}</p>

      {/* Прогресс-бар */}
      <div className="mt-4 mb-3 h-1.5 rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Нижняя строка */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="opacity-70" />
          <span className="text-xs opacity-80">{formatRub(pending)} ожидает</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen size={13} className="opacity-70" />
          <span className="text-xs opacity-80">
            {paidCount}/{lessonsCount} {pluralize(lessonsCount, ['урок', 'урока', 'уроков'])}
          </span>
        </div>
      </div>
    </div>
  )
}
