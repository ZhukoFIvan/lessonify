'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebtors, usePayAllForStudent } from '@/hooks/use-payments'
import { getInitials, formatRub, pluralize } from '@tutorflow/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckCircle2, AlertCircle, Check } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export function DebtorsList() {
  const { debtors, loading, refetch } = useDebtors()
  const { payAll, loadingId } = usePayAllForStudent()

  async function handlePayAll(studentId: string, name: string) {
    try {
      const result = await payAll(studentId)
      toast({
        variant: 'success',
        title: `${name} — долг погашен`,
        description: `${result.count} ${pluralize(result.count, ['урок', 'урока', 'уроков'])} · ${formatRub(result.total)}`,
      })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось провести оплату' })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[76px] rounded-2xl" />)}
      </div>
    )
  }

  if (debtors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
        <CheckCircle2 size={40} strokeWidth={1.5} className="text-success" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Долгов нет</p>
          <p className="text-xs mt-0.5">Все уроки оплачены</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {debtors.map((debtor) => (
        <div
          key={debtor.studentId}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={debtor.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(debtor.studentName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{debtor.studentName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pluralize(debtor.unpaidLessonsCount, ['урок', 'урока', 'уроков'])}
                {debtor.lastLessonDate && (
                  <> · последний {format(new Date(debtor.lastLessonDate), 'd MMM', { locale: ru })}</>
                )}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <p className="text-sm font-bold text-warning">{formatRub(debtor.debtAmount)}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="secondary"
              className="w-full border-success/30 text-success hover:bg-success/10"
              onClick={() => handlePayAll(debtor.studentId, debtor.studentName)}
              disabled={loadingId === debtor.studentId}
            >
              {loadingId === debtor.studentId
                ? 'Проводим оплату...'
                : <><Check size={13} className="mr-1.5 inline" />Принять оплату · {formatRub(debtor.debtAmount)}</>}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
