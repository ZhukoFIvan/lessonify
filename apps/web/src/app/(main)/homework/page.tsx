'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
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
import { fadeUp } from '@/lib/motion'

const FILTERS: { labelKey: string; value: HomeworkStatus | undefined }[] = [
  { labelKey: 'filters.all', value: undefined },
  { labelKey: 'filters.assigned', value: 'ASSIGNED' },
  { labelKey: 'filters.submitted', value: 'SUBMITTED' },
  { labelKey: 'filters.reviewed', value: 'REVIEWED' },
]

// ── Страница для ученика ───────────────────────────────────────────────────────

function StudentHomeworkPage() {
  const t = useTranslations('homework')
  const [filter, setFilter] = useState<HomeworkStatus | undefined>(undefined)
  const { items, loading, refetch } = useStudentHomework(filter)
  const { submit, loadingId } = useSubmitHomework()

  async function handleSubmit(id: string, submissionText?: string, fileUrls?: string[]) {
    try {
      await submit(id, submissionText, fileUrls)
      toast({ variant: 'success', title: t('toast.submitted') })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('toast.error'), description: t('toast.submitFailed') })
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
  const t = useTranslations('homework')
  const [filter, setFilter] = useState<HomeworkStatus | undefined>(undefined)
  const { items, loading, refetch } = useTutorHomework(filter)
  const { reviewHomework, loadingId } = useReviewHomework()

  async function handleReview(id: string, feedback: string) {
    try {
      await reviewHomework(id, feedback)
      toast({ variant: 'success', title: t('toast.reviewed') })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('toast.error'), description: t('toast.reviewFailed') })
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
  const t = useTranslations('homework')
  // Показываем скелетоны только при первой загрузке; при смене фильтра — просто затемняем
  const [everLoaded, setEverLoaded] = useState(false)
  useEffect(() => {
    if (!loading) setEverLoaded(true)
  }, [loading])

  const showSkeleton = loading && !everLoaded
  const isDimmed = loading && everLoaded

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col flex-1">
        <motion.div variants={fadeUp(0)} initial="hidden" animate="show" className="px-4 lg:px-0 pt-5 lg:pt-0 pb-3 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-h2 lg:text-h1 text-foreground">{t('title')}</h1>
            <p className="text-xs lg:text-sm text-muted-foreground mt-1 min-h-[1em]">
              {!showSkeleton && (count === 0 ? t('noTasks') : t('taskCount', { count }))}
            </p>
          </div>
        </motion.div>

        {/* Сегментированный фильтр — утопленная дорожка с активным брендовым чипом */}
        <motion.div variants={fadeUp(0.08)} initial="hidden" animate="show" className="px-4 lg:px-0 pb-4">
          <div className="inline-flex max-w-full gap-1 rounded-full bg-surface-0 border border-[var(--border-subtle)] p-1 scroll-x">
            {FILTERS.map(({ labelKey, value }) => {
              const active = filter === value
              return (
                <button
                  key={labelKey}
                  onClick={() => onFilter(value)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200',
                    active
                      ? 'bg-surface-2 text-foreground shadow-elevation-1 border border-[var(--border-subtle)]'
                      : 'text-muted-foreground hover:text-foreground border border-transparent',
                  )}
                >
                  {t(labelKey)}
                </button>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={fadeUp(0.16)} initial="hidden" animate="show" className={cn('flex-1 px-4 lg:px-0 pb-4 transition-opacity duration-150', isDimmed && 'opacity-40 pointer-events-none')}>
          {showSkeleton ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-[164px] rounded-lg" />)}
            </div>
          ) : count === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 gap-4 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-surface-1 border border-[var(--border-subtle)] shadow-elevation-1 flex items-center justify-center">
                <BookOpen size={28} strokeWidth={1.5} className="text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {filter ? t('emptyState.filteredTitle') : t('emptyState.title')}
                </p>
                <p className="text-xs mt-1">
                  {filter ? t('emptyState.filteredHint') : t('emptyState.hint')}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 items-start">{children}</div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ── Роутинг по роли ───────────────────────────────────────────────────────────

export default function HomeworkPage() {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'TUTOR' ? <TutorHomeworkPage /> : <StudentHomeworkPage />
}
