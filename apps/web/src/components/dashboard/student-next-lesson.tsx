'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useStudentNextLesson } from '@/hooks/use-lessons'
import { getLessonTimeRange, formatDuration, getInitials } from '@tutorflow/utils'
import { Clock } from 'lucide-react'

function getCountdown(startTime: string): string {
  const diff = new Date(startTime).getTime() - Date.now()
  if (diff <= 0) return 'Сейчас'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `через ${h}ч ${m}м`
  return `через ${m} мин`
}

export function StudentNextLesson() {
  const { lesson, loading } = useStudentNextLesson()
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    if (!lesson) return
    setCountdown(getCountdown(lesson.startTime))
    const interval = setInterval(() => setCountdown(getCountdown(lesson.startTime)), 60_000)
    return () => clearInterval(interval)
  }, [lesson])

  if (loading) return <Skeleton className="mx-4 h-24 rounded-2xl" />
  if (!lesson) return null

  const minutesUntil = (new Date(lesson.startTime).getTime() - Date.now()) / 60_000
  const isNear = minutesUntil <= 30

  return (
    <section className="px-4">
      <Card className={isNear ? 'border-warning/40 bg-warning/5' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={lesson.tutor.user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-sm">
                {getInitials(lesson.tutor.user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Следующий урок</p>
              <p className="font-bold text-sm text-foreground truncate">{lesson.subject}</p>
              <p className="text-xs text-muted-foreground">{lesson.tutor.user.name}</p>
            </div>

            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Clock size={12} className={isNear ? 'text-warning' : 'text-muted-foreground'} />
                <span className={`text-xs font-semibold ${isNear ? 'text-warning' : 'text-muted-foreground'}`}>
                  {countdown}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getLessonTimeRange(lesson.startTime, lesson.durationMinutes)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatDuration(lesson.durationMinutes)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
