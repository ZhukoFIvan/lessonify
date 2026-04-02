'use client'

import Link from 'next/link'
import { ChevronRight, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebtors } from '@/hooks/use-payments'
import { formatRub, getInitials, pluralize } from '@tutorflow/utils'

export function DebtorsStrip() {
  const { debtors, loading } = useDebtors()

  if (loading) return <Skeleton className="h-full min-h-[7rem] rounded-2xl" />
  if (debtors.length === 0) return null

  const total = debtors.reduce((s, d) => s + d.debtAmount, 0)

  return (
    <section className="h-full rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Должны заплатить</h3>
        </div>
        <Link href="/finances" className="flex items-center text-xs text-primary font-medium gap-0.5">
          Все <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {debtors.slice(0, 3).map((debtor) => (
          <div key={debtor.studentId} className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={debtor.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(debtor.studentName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{debtor.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {pluralize(debtor.unpaidLessonsCount, ['урок', 'урока', 'уроков'])}
              </p>
            </div>
            <span className="text-sm font-bold text-warning shrink-0">{formatRub(debtor.debtAmount)}</span>
          </div>
        ))}

        {debtors.length > 3 && (
          <Link href="/finances" className="text-xs text-primary font-medium text-center pt-1">
            ещё {debtors.length - 3} чел. · итого {formatRub(total)}
          </Link>
        )}

        {debtors.length <= 3 && debtors.length > 1 && (
          <div className="text-xs text-muted-foreground text-center pt-1 border-t border-border">
            Итого: <span className="font-semibold text-warning">{formatRub(total)}</span>
          </div>
        )}
      </div>
    </section>
  )
}
