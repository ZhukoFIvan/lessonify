'use client'

import { useState } from 'react'
import { isToday, isTomorrow, isYesterday, format, formatISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LessonCard } from '@/components/lesson/lesson-card'
import { AddLessonModal } from '@/components/lesson/add-lesson-modal'
import { AddHomeworkModal } from '@/components/homework/add-homework-modal'
import { BookingSlotsView } from '@/components/calendar/booking-slots-view'
import { usePayLesson, useRemindLesson } from '@/hooks/use-lessons'
import { useMyTutor } from '@/hooks/use-my-tutor'
import { pluralize } from '@tutorflow/utils'
import { useAuthStore } from '@/store/auth.store'
import type { LessonWithStudent, LessonWithTutor } from '@tutorflow/types'
import { toast } from '@/components/ui/use-toast'

type CalendarLesson = LessonWithStudent | LessonWithTutor

function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Сегодня'
  if (isTomorrow(date)) return 'Завтра'
  if (isYesterday(date)) return 'Вчера'
  return format(date, 'd MMMM', { locale: ru })
}

interface DayViewProps {
  date: Date
  lessons: CalendarLesson[]
  loading: boolean
  onRefetch: () => void
}

export function DayView({ date, lessons, loading, onRefetch }: DayViewProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [hwLessonId, setHwLessonId] = useState<string | null>(null)
  const { payLesson, loadingId: payLoadingId } = usePayLesson()
  const { remindLesson, loadingId: remindLoadingId } = useRemindLesson()
  const role = useAuthStore((s) => s.user?.role)
  const isTutor = role === 'TUTOR'
  // useMyTutor делает запрос только если нужен (студент)
  const { tutor } = useMyTutor()

  const dayLabel = getDayLabel(date)

  async function handlePay(lessonId: string) {
    await payLesson(lessonId)
    onRefetch()
  }

  async function handleRemind(lessonId: string) {
    try {
      await remindLesson(lessonId)
      toast({ variant: 'success', title: 'Напоминание отправлено ученику' })
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Не удалось отправить напоминание'
      toast({ variant: 'destructive', title: 'Ошибка', description: message })
    }
  }

  return (
    <div className="px-4 pt-1 pb-4">
      {/* Заголовок дня */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-foreground">{dayLabel}</h2>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {lessons.length === 0
                ? 'Уроков нет'
                : pluralize(lessons.length, ['урок', 'урока', 'уроков'])}
            </p>
          )}
        </div>
        {isTutor && (
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 px-4">
            <Plus size={15} />
            Урок
          </Button>
        )}
      </div>

      {/* Список уроков */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[76px]" />)}
        </div>
      ) : lessons.length === 0 ? (
        isTutor ? (
          <button
            onClick={() => setAddOpen(true)}
            className="w-full rounded-2xl border-2 border-dashed border-border py-10 flex flex-col items-center gap-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Plus size={22} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Нет уроков</p>
              <p className="text-xs mt-0.5">Нажмите, чтобы добавить</p>
            </div>
          </button>
        ) : (
          <div>
            <div className="py-6 flex flex-col items-center gap-1 text-muted-foreground">
              <p className="text-sm font-medium">Уроков нет</p>
            </div>
            <BookingSlotsView date={date} tutorId={tutor?.id ?? null} />
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPay={isTutor ? handlePay : undefined}
              payLoading={payLoadingId === lesson.id}
              onRemind={isTutor ? handleRemind : undefined}
              remindLoading={remindLoadingId === lesson.id}
              onAddHomework={isTutor ? (id) => setHwLessonId(id) : undefined}
            />
          ))}
        </div>
      )}

      {isTutor && (
        <AddLessonModal
          key={format(date, 'yyyy-MM-dd')}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={onRefetch}
          defaultDate={date}
        />
      )}

      {isTutor && hwLessonId && (
        <AddHomeworkModal
          open={!!hwLessonId}
          lessonId={hwLessonId}
          onClose={() => setHwLessonId(null)}
        />
      )}
    </div>
  )
}
