'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronRight, Plus } from 'lucide-react'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddLessonModal } from '@/components/lesson/add-lesson-modal'
import { useDayLessons } from '@/hooks/use-lessons'
import { getInitials, pluralize } from '@tutorflow/utils'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

const PAYMENT_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
}
const PAYMENT_LABELS: Record<string, string> = {
  PAID: 'Оплачено',
  PENDING: 'Ожидает',
  OVERDUE: 'Просрочено',
}

export function TodayLessons() {
  const { lessons, loading, refetch } = useDayLessons(new Date())
  const [addOpen, setAddOpen] = useState(false)

  if (loading) return <Skeleton className="h-full min-h-[7rem] rounded-lg" />

  return (
    <section className="h-full rounded-lg bg-card border border-[var(--border-subtle)] shadow-elevation-1 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Уроки сегодня</h3>
        </div>
        {lessons.length > 0 && (
          <span className="text-xs text-muted-foreground tnum">
            {pluralize(lessons.length, ['урок', 'урока', 'уроков'])}
          </span>
        )}
      </div>

      {lessons.length === 0 ? (
        <button
          onClick={() => setAddOpen(true)}
          className="flex-1 rounded-md border-2 border-dashed border-[var(--border-strong)] py-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus size={20} />
          <span className="text-xs font-medium">Запланировать урок</span>
        </button>
      ) : (
        <motion.div
          className="flex flex-col gap-2 flex-1"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {lessons.slice(0, 4).map((lesson) => (
            <motion.div key={lesson.id} variants={staggerItem}>
              <Link
                href="/calendar"
                className="flex items-center gap-2.5 py-1.5 rounded-md hover:bg-surface-2 transition-colors px-1 -mx-1"
              >
                <span className="text-xs font-mono tnum text-muted-foreground w-10 shrink-0">
                  {new Date(lesson.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: lesson.student.color ?? '#6C63FF' }}
                />
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={lesson.student.user?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(lesson.student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{lesson.student.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lesson.subject}</p>
                </div>
                <Badge variant={PAYMENT_VARIANT[lesson.paymentStatus] ?? 'secondary'} className="text-[10px] shrink-0">
                  {PAYMENT_LABELS[lesson.paymentStatus]}
                </Badge>
              </Link>
            </motion.div>
          ))}
          {lessons.length > 4 && (
            <Link href="/calendar" className="flex items-center justify-center gap-1 text-xs text-primary font-medium pt-1">
              ещё {lessons.length - 4} <ChevronRight size={14} />
            </Link>
          )}
        </motion.div>
      )}

      <AddLessonModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={refetch} />
    </section>
  )
}
