'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { HomeworkCard } from '@/components/homework/homework-card'
import { TutorHomeworkCard } from '@/components/homework/tutor-homework-card'
import { useStudentHomework, useSubmitHomework, useTutorHomework, useReviewHomework } from '@/hooks/use-homework'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/components/ui/use-toast'
import { BookOpen } from 'lucide-react'
import type { HomeworkStatus } from '@tutorflow/types'
import { cn } from '@/lib/utils'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
})

const FILTERS: { label: string; value: HomeworkStatus | undefined }[] = [
  { label: 'Все', value: undefined },
  { label: 'Задано', value: 'ASSIGNED' },
  { label: 'Сдано', value: 'SUBMITTED' },
  { label: 'Проверено', value: 'REVIEWED' },
]

// ── Страница для ученика ───────────────────────────────────────────────────────

function StudentHomeworkPage() {
  const [filter, setFilter] = useState<HomeworkStatus | undefined>(undefined)
  const { items, loading, refetch } = useStudentHomework(filter)
  const { submit, loadingId } = useSubmitHomework()

  async function handleSubmit(id: string, submissionText?: string, fileUrls?: string[]) {
    try {
      await submit(id, submissionText, fileUrls)
      toast({ variant: 'success', title: 'Задание сдано' })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить задание' })
    }
  }

  return (
    <HomeworkLayout
      filter={filter}
      onFilter={setFilter}
      count={items.length}
      loading={loading}
    >
      {items.map((item) => (
        <HomeworkCard
          key={item.id}
          item={item}
          onSubmit={handleSubmit}
          submitLoading={loadingId === item.id}
        />
      ))}
    </HomeworkLayout>
  )
}

// ── Страница для репетитора ───────────────────────────────────────────────────

function TutorHomeworkPage() {
  const [filter, setFilter] = useState<HomeworkStatus | undefined>(undefined)
  const { items, loading, refetch } = useTutorHomework(filter)
  const { reviewHomework, loadingId } = useReviewHomework()

  async function handleReview(id: string, feedback: string) {
    try {
      await reviewHomework(id, feedback)
      toast({ variant: 'success', title: 'Задание проверено' })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить проверку' })
    }
  }

  return (
    <HomeworkLayout
      filter={filter}
      onFilter={setFilter}
      count={items.length}
      loading={loading}
    >
      {items.map((item) => (
        <TutorHomeworkCard
          key={item.id}
          item={item}
          onReview={handleReview}
          reviewLoading={loadingId === item.id}
        />
      ))}
    </HomeworkLayout>
  )
}

// ── Общий layout ──────────────────────────────────────────────────────────────

function HomeworkLayout({
  filter,
  onFilter,
  count,
  loading,
  children,
}: {
  filter: HomeworkStatus | undefined
  onFilter: (v: HomeworkStatus | undefined) => void
  count: number
  loading: boolean
  children: React.ReactNode
}) {
  // Показываем скелетоны только при первой загрузке; при смене фильтра — просто затемняем
  const [everLoaded, setEverLoaded] = useState(false)
  useEffect(() => {
    if (!loading) setEverLoaded(true)
  }, [loading])

  const showSkeleton = loading && !everLoaded
  const isDimmed = loading && everLoaded

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      <motion.div {...fadeUp(0)} className="px-4 lg:px-0 pt-5 lg:pt-0 pb-3">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Домашние задания</h1>
        <p className="text-xs lg:text-sm text-muted-foreground mt-0.5 min-h-[1em]">
          {!showSkeleton && (count === 0 ? 'Нет заданий' : `${count} задан${count === 1 ? 'ие' : 'ия'}`)}
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="flex gap-2 px-4 lg:px-0 pb-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => onFilter(value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors',
              filter === value
                ? 'bg-primary text-white border-primary'
                : 'bg-background text-foreground border-border',
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      <motion.div {...fadeUp(0.16)} className={cn('flex-1 px-4 lg:px-0 pb-4 transition-opacity duration-150', isDimmed && 'opacity-40 pointer-events-none')}>
        {showSkeleton ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[140px] rounded-2xl" />)}
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 gap-3 text-muted-foreground">
            <BookOpen size={40} strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {filter ? 'Нет заданий с таким статусом' : 'Заданий нет'}
              </p>
              <p className="text-xs mt-0.5">
                {filter ? '' : 'Задания появятся здесь после создания'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">{children}</div>
        )}
      </motion.div>
    </div>
  )
}

// ── Роутинг по роли ───────────────────────────────────────────────────────────

export default function HomeworkPage() {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'TUTOR' ? <TutorHomeworkPage /> : <StudentHomeworkPage />
}
