'use client'

import Link from 'next/link'
import { ChevronRight, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebtors } from '@/hooks/use-payments'
import { formatRub, getInitials, pluralize } from '@tutorflow/utils'

export function DebtorsStrip() {
  const { debtors, loading } = useDebtors()

  if (loading) return <Skeleton className="h-full min-h-[7rem] rounded-lg" />
  if (debtors.length === 0) return null

  const total = debtors.reduce((s, d) => s + d.debtAmount, 0)

  return (
    <section className="h-full rounded-lg bg-card border border-[var(--border-subtle)] shadow-elevation-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Должны заплатить</h3>
        </div>
        <Link href="/finances" className="flex items-center text-xs text-primary font-medium gap-0.5">
          Все <ChevronRight size={14} />
        </Link>
      </div>

      {/* На десктопе раскладываем в несколько колонок — без пустот справа */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-2.5">
        {debtors.slice(0, 6).map((debtor) => (
          <div
            key={debtor.studentId}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-2 transition-colors"
          >
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={debtor.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(debtor.studentName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{debtor.studentName}</p>
              <p className="text-xs text-muted-foreground tnum">
                {pluralize(debtor.unpaidLessonsCount, ['урок', 'урока', 'уроков'])}
              </p>
            </div>
            <span className="text-sm font-bold text-warning shrink-0 tnum">{formatRub(debtor.debtAmount)}</span>
          </div>
        ))}
      </div>

      {/* Подвал: итог + ссылка на всех должников */}
      {debtors.length > 1 && (
        <div className="mt-3 pt-3 flex items-center justify-between border-t border-[var(--border-subtle)]">
          <span className="text-xs text-muted-foreground">
            Итого: <span className="font-semibold text-warning tnum">{formatRub(total)}</span>
          </span>
          {debtors.length > 6 && (
            <Link href="/finances" className="flex items-center text-xs text-primary font-medium gap-0.5">
              ещё {debtors.length - 6} чел. <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
