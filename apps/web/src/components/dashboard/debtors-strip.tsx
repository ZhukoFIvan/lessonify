'use client'

import Link from 'next/link'
import { ChevronRight, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebtors } from '@/hooks/use-payments'
import { usePayLesson } from '@/hooks/use-lessons'
import { formatRub, getInitials, pluralize } from '@tutorflow/utils'

export function DebtorsStrip() {
  const { debtors, loading, refetch } = useDebtors()
  const { payLesson, loadingId } = usePayLesson()

  if (loading) return <Skeleton className="mx-4 h-24" />
  if (debtors.length === 0) return null

  const total = debtors.reduce((s, d) => s + d.debtAmount, 0)

  return (
    <section className="px-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={15} className="text-warning" />
          <h2 className="text-base font-bold text-foreground">Должны заплатить</h2>
        </div>
        <Link href="/finances" className="flex items-center text-xs text-primary font-medium gap-0.5">
          Все <ChevronRight size={14} />
        </Link>
      </div>

      {/* Горизонтальный скролл карточек должников */}
      <div className="scroll-x flex gap-3 pb-1">
        {debtors.slice(0, 5).map((debtor) => (
          <Card key={debtor.studentId} className="shrink-0 w-44">
            <CardContent className="p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={debtor.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(debtor.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{debtor.studentName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {pluralize(debtor.unpaidLessonsCount, ['урок', 'урока', 'уроков'])}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-warning">{formatRub(debtor.debtAmount)}</p>
            </CardContent>
          </Card>
        ))}

        {/* Итого */}
        {debtors.length > 1 && (
          <Card className="shrink-0 w-36 bg-warning/5 border-warning/20">
            <CardContent className="p-3 flex flex-col items-center justify-center gap-1 h-full">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Итого долг</p>
              <p className="text-base font-bold text-warning">{formatRub(total)}</p>
              <p className="text-[10px] text-muted-foreground">{debtors.length} чел.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
