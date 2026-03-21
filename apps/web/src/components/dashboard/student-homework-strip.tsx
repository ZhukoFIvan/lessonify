'use client'

import Link from 'next/link'
import { ChevronRight, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentHomework } from '@/hooks/use-homework'
import { format, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function StudentHomeworkStrip() {
  const { items, loading } = useStudentHomework('ASSIGNED')

  if (loading) return <Skeleton className="mx-4 h-24" />
  if (items.length === 0) return null

  // Показываем только 3 ближайших по дедлайну
  const upcoming = items
    .filter((hw) => hw.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3)

  if (upcoming.length === 0) return null

  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-primary" />
          <h2 className="text-base font-bold text-foreground">Домашние задания</h2>
        </div>
        <Link href="/homework" className="flex items-center text-xs text-primary font-medium gap-0.5">
          Все <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {upcoming.map((hw) => {
          const daysLeft = differenceInDays(new Date(hw.deadline!), new Date())
          const isUrgent = daysLeft <= 1
          return (
            <Card key={hw.id} className={cn(isUrgent && 'border-warning/40')}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{hw.lesson.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{hw.description}</p>
                </div>
                <Badge variant={isUrgent ? 'warning' : 'secondary'} className="shrink-0 text-xs">
                  {daysLeft === 0
                    ? 'Сегодня'
                    : daysLeft === 1
                      ? 'Завтра'
                      : format(new Date(hw.deadline!), 'd MMM', { locale: ru })}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
