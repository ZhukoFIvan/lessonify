'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LessonCard } from '@/components/lesson/lesson-card'
import { AddLessonModal } from '@/components/lesson/add-lesson-modal'
import { useDayLessons, usePayLesson } from '@/hooks/use-lessons'
import { pluralize } from '@tutorflow/utils'
import { useState } from 'react'

export function TodayLessons() {
  const { lessons, loading, refetch } = useDayLessons(new Date())
  const { payLesson, loadingId } = usePayLesson()
  const [addOpen, setAddOpen] = useState(false)

  async function handlePay(lessonId: string) {
    await payLesson(lessonId)
    refetch()
  }

  return (
    <section className="px-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Сегодня</h2>
          {!loading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {lessons.length === 0
                ? 'Уроков нет'
                : pluralize(lessons.length, ['урок', 'урока', 'уроков'])}
            </p>
          )}
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 px-4">
          <Plus size={15} />
          Добавить
        </Button>
      </div>

      {/* Список */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : lessons.length === 0 ? (
        <button
          onClick={() => setAddOpen(true)}
          className="w-full rounded-2xl border-2 border-dashed border-border py-8 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Plus size={20} />
          </div>
          <span className="text-sm">Добавить первый урок на сегодня</span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onPay={handlePay}
              payLoading={loadingId === lesson.id}
            />
          ))}
        </div>
      )}

      <AddLessonModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={refetch} />
    </section>
  )
}
