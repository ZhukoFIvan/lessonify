'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getLessonTimeRange, formatDuration, getInitials } from '@tutorflow/utils'
import { formatRub } from '@tutorflow/utils'
import type { LessonWithStudent, LessonWithTutor } from '@tutorflow/types'
import { cn } from '@/lib/utils'
import { Bell, BookPlus, Check } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { LessonNotesPanel } from '@/components/lesson/lesson-notes-panel'

type CalendarLesson = LessonWithStudent | LessonWithTutor

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Запланирован',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
  RESCHEDULED: 'Перенесён',
}

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

interface LessonCardProps {
  lesson: CalendarLesson
  onPay?: (lessonId: string) => void
  payLoading?: boolean
  onRemind?: (lessonId: string) => void
  remindLoading?: boolean
  onAddHomework?: (lessonId: string) => void
  className?: string
}

export function LessonCard({ lesson, onPay, payLoading, onRemind, remindLoading, onAddHomework, className }: LessonCardProps) {
  const role = useAuthStore((s) => s.user?.role)
  const isPending = lesson.paymentStatus === 'PENDING' || lesson.paymentStatus === 'OVERDUE'
  const isCompleted = lesson.status === 'COMPLETED'
  const isScheduled = lesson.status === 'SCHEDULED'

  // Определяем, кого показывать
  const isTutorView = role === 'TUTOR'
  const displayName = isTutorView
    ? lesson.student.name
    : 'tutor' in lesson
      ? lesson.tutor.user.name
      : lesson.student.name
  const displayAvatar = isTutorView
    ? lesson.student.user?.avatarUrl
    : 'tutor' in lesson
      ? lesson.tutor.user.avatarUrl
      : lesson.student.user?.avatarUrl
  const displayColor = lesson.student.color ?? '#6C63FF'

  return (
    <Card className={cn('card-hover', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Временная метка */}
          <div className="w-12 shrink-0 text-center">
            <p className="text-sm font-bold text-foreground">
              {new Date(lesson.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDuration(lesson.durationMinutes)}
            </p>
          </div>

          {/* Цветная полоска слева (цвет ученика) */}
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: displayColor }}
          />

          {/* Аватар */}
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src={displayAvatar ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          {/* Информация */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">{lesson.subject}</p>
          </div>

          {/* Правая часть */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={PAYMENT_VARIANT[lesson.paymentStatus] ?? 'secondary'}>
              {PAYMENT_LABELS[lesson.paymentStatus]}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">{formatRub(lesson.price)}</span>
          </div>
        </div>

        {/* Кнопка оплаты — только для завершённых неоплаченных уроков */}
        {isCompleted && isPending && onPay && (
          <div className="mt-3 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="secondary"
              className="w-full border-success/30 text-success hover:bg-success/10"
              onClick={() => onPay(lesson.id)}
              disabled={payLoading}
            >
              {payLoading
                ? 'Сохранение...'
                : <><Check size={13} className="mr-1.5 inline" />Отметить оплаченным · {formatRub(lesson.price)}</>}
            </Button>
          </div>
        )}

        {/* Кнопка напоминания — только для запланированных уроков */}
        {isScheduled && onRemind && (
          <div className="mt-3 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="secondary"
              className="w-full gap-2"
              onClick={() => onRemind(lesson.id)}
              disabled={remindLoading}
            >
              <Bell size={14} />
              {remindLoading ? 'Отправка...' : 'Напомнить ученику'}
            </Button>
          </div>
        )}

        {/* Кнопка добавления ДЗ — только репетитор */}
        {isTutorView && onAddHomework && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => onAddHomework(lesson.id)}
            >
              <BookPlus size={14} />
              Добавить ДЗ
            </Button>
          </div>
        )}

        {/* Журнал урока — для всех */}
        <div className="border-t border-border mt-3 pt-2">
          <LessonNotesPanel lessonId={lesson.id} />
        </div>
      </CardContent>
    </Card>
  )
}
