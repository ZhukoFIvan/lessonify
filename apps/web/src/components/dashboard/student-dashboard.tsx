'use client'

import { useStudentNextLesson } from '@/hooks/use-lessons'
import { useStudentHomework } from '@/hooks/use-homework'
import { StudentNextLesson } from './student-next-lesson'
import { StudentHomeworkStrip } from './student-homework-strip'
import { Skeleton } from '@/components/ui/skeleton'
import { isToday } from 'date-fns'
import { Moon, Sun, CloudSun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function getRestIcon(): LucideIcon {
  const h = new Date().getHours()
  if (h < 6) return Moon
  if (h < 12) return Sun
  if (h < 18) return CloudSun
  return Moon
}

function getRestMessage(): { title: string; sub: string } {
  const h = new Date().getHours()
  if (h < 12) return { title: 'Сегодня свободен', sub: 'Хорошее начало дня без занятий' }
  if (h < 17) return { title: 'Сегодня свободен', sub: 'Можно отдохнуть или заняться чем-то своим' }
  return { title: 'На сегодня всё', sub: 'Уроков и заданий нет — заслуженный отдых' }
}

export function StudentDashboard() {
  const { lesson, loading: lessonLoading } = useStudentNextLesson()
  const { items: hwItems, loading: hwLoading } = useStudentHomework('ASSIGNED')

  const loading = lessonLoading || hwLoading

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-4 mt-5">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    )
  }

  // Есть ли урок сегодня
  const hasTodayLesson = lesson && isToday(new Date(lesson.startTime))
  // Есть ли ДЗ с дедлайном
  const hasHomework = hwItems.some((hw) => hw.deadline)

  const isEmpty = !hasTodayLesson && !hasHomework

  if (isEmpty) {
    const RestIcon = getRestIcon()
    const { title, sub } = getRestMessage()

    return (
      <div className="px-4 mt-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
          {/* Декоративные круги */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/8 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-primary/6 blur-xl" />

          <div className="relative flex flex-col items-center text-center gap-3 py-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <RestIcon size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{sub}</p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">0</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">уроков</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-primary">0</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">заданий</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 mt-5">
      <StudentNextLesson />
      <StudentHomeworkStrip />
    </div>
  )
}
