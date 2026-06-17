'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LessonCard } from '@/components/lesson/lesson-card'
import { AddLessonModal } from '@/components/lesson/add-lesson-modal'
import { AddHomeworkModal } from '@/components/homework/add-homework-modal'
import { BookingSlotsView } from '@/components/calendar/booking-slots-view'
import { usePayLesson, useRemindLesson } from '@/hooks/use-lessons'
import { useMyTutor } from '@/hooks/use-my-tutor'
import { useFormatters } from '@/i18n/use-formatters'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { useAuthStore } from '@/store/auth.store'
import type { LessonWithStudent, LessonWithTutor } from '@tutorflow/types'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

type CalendarLesson = LessonWithStudent | LessonWithTutor

interface DayViewProps {
  date: Date
  lessons: CalendarLesson[]
  loading: boolean
  onRefetch: () => void
  /** Плотный режим для десктопной колонки (день встроен в карточку) */
  dense?: boolean
}

export function DayView({ date, lessons, loading, onRefetch, dense = false }: DayViewProps) {
  const t = useTranslations('calendar')
  const f = useFormatters()
  const [addOpen, setAddOpen] = useState(false)
  const [hwLessonId, setHwLessonId] = useState<string | null>(null)
  const { payLesson, loadingId: payLoadingId } = usePayLesson()
  const { remindLesson, loadingId: remindLoadingId } = useRemindLesson()
  const role = useAuthStore((s) => s.user?.role)
  const isTutor = role === 'TUTOR'
  // useMyTutor делает запрос только если нужен (студент)
  const { tutor } = useMyTutor()

  const dayLabel = f.lessonDate(date.toISOString())

  async function handlePay(lessonId: string) {
    await payLesson(lessonId)
    onRefetch()
  }

  async function handleRemind(lessonId: string) {
    try {
      await remindLesson(lessonId)
      toast({ variant: 'success', title: t('reminderSent') })
    } catch (err: any) {
      const message = err?.response?.data?.error || t('reminderFailed')
      toast({ variant: 'destructive', title: t('error'), description: message })
    }
  }

  return (
    <div
      className={cn(
        dense ? 'flex flex-col px-5 pt-5 pb-5' : 'px-4 pt-1 pb-4',
      )}
    >
      {/* Заголовок дня */}
      <div
        className={cn(
          'flex items-center justify-between',
          dense ? 'mb-4 shrink-0' : 'mb-4',
        )}
      >
        <div>
          <h2 className={cn('font-bold text-foreground', dense ? 'text-h3 capitalize' : 'text-base')}>
            {dayLabel}
          </h2>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {lessons.length === 0
                ? t('noLessonsToday')
                : f.count(lessons.length, 'lessons')}
            </p>
          )}
        </div>
        {isTutor && (
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 px-4">
            <Plus size={15} />
            {t('lesson')}
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
            className={cn(
              'group flex w-full flex-col items-center gap-3 rounded-lg border border-dashed border-strong text-muted-foreground transition-all hover:border-primary/50 hover:text-primary',
              dense ? 'py-12' : 'py-10',
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Plus size={22} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground group-hover:text-primary">{t('noLessons')}</p>
              <p className="mt-0.5 text-xs">{t('tapToAdd')}</p>
            </div>
          </button>
        ) : (
          <div>
            <div className="py-6 flex flex-col items-center gap-1 text-muted-foreground">
              <p className="text-sm font-medium">{t('noLessonsToday')}</p>
            </div>
            <BookingSlotsView date={date} tutorId={tutor?.id ?? null} />
          </div>
        )
      ) : (
        <motion.div
          className="flex flex-col gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {lessons.map((lesson) => (
            <motion.div key={lesson.id} variants={staggerItem}>
              <LessonCard
                lesson={lesson}
                onPay={isTutor ? handlePay : undefined}
                payLoading={payLoadingId === lesson.id}
                onRemind={isTutor ? handleRemind : undefined}
                remindLoading={remindLoadingId === lesson.id}
                onAddHomework={isTutor ? (id) => setHwLessonId(id) : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
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
