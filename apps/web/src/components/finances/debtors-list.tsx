'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatNumber } from '@/components/ui/stat'
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

  const totalDebt = debtors.reduce((sum, d) => sum + d.debtAmount, 0)

  return (
    <section className="surface-1 overflow-hidden rounded-xl shadow-elevation-1">
      {/* Шапка-герой: общая задолженность */}
      <header className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] bg-surface-2/60 p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--warning)/0.14)] text-warning ring-1 ring-inset ring-[hsl(var(--warning)/0.22)]">
            <AlertCircle size={20} />
          </span>
          <div>
            <h2 className="text-h3 font-bold text-foreground">Должны заплатить</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loading
                ? 'Загружаем…'
                : debtors.length === 0
                  ? 'Все уроки оплачены'
                  : `${pluralize(debtors.length, ['ученик', 'ученика', 'учеников'])} с задолженностью`}
            </p>
          </div>
        </div>

        {!loading && debtors.length > 0 && (
          <div className="text-right">
            <StatNumber
              value={new Intl.NumberFormat('ru-RU').format(totalDebt)}
              unit="₽"
              size="stat"
              className="justify-end text-warning [&_.hero-unit]:text-warning/70"
            />
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              всего к оплате
            </p>
          </div>
        )}
      </header>

      <div className="p-4 lg:p-5">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[124px] rounded-lg" />
            ))}
          </div>
        ) : debtors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--success)/0.12)]">
              <CheckCircle2 size={28} strokeWidth={1.75} className="text-success" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Долгов нет</p>
              <p className="mt-0.5 text-xs">Все уроки оплачены — отличная работа</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {debtors.map((debtor) => (
              <article
                key={debtor.studentId}
                className="group flex flex-col gap-3 rounded-lg border border-[var(--border-subtle)] bg-card p-4 shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-elevation-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={debtor.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(debtor.studentName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {debtor.studentName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {pluralize(debtor.unpaidLessonsCount, ['урок', 'урока', 'уроков'])}
                      {debtor.lastLessonDate && (
                        <> · {format(new Date(debtor.lastLessonDate), 'd MMM', { locale: ru })}</>
                      )}
                    </p>
                  </div>

                  <Badge variant="warning" className="tnum shrink-0 tabular-nums">
                    {formatRub(debtor.debtAmount)}
                  </Badge>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full border border-success/30 text-success hover:bg-success/10"
                  onClick={() => handlePayAll(debtor.studentId, debtor.studentName)}
                  disabled={loadingId === debtor.studentId}
                >
                  {loadingId === debtor.studentId ? (
                    'Проводим оплату…'
                  ) : (
                    <>
                      <Check size={13} className="mr-1.5 inline" />
                      Принять оплату
                    </>
                  )}
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
