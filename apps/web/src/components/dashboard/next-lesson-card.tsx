'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, ChevronRight, PartyPopper, Timer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useNextLesson } from '@/hooks/use-lessons'
import { getLessonTimeRange, getMinutesUntil } from '@tutorflow/utils'
import { getInitials } from '@tutorflow/utils'

function useCountdown(targetIso: string | null) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (!targetIso) return

    function update() {
      const diff = new Date(targetIso!).getTime() - Date.now()
      if (diff <= 0) {
        setDisplay('Идёт сейчас')
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      if (h > 0) setDisplay(`${h}ч ${m}м`)
      else if (m > 0) setDisplay(`${m}м ${s}с`)
      else setDisplay(`${s}с`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetIso])

  return display
}

export function NextLessonCard() {
  const { lesson, loading } = useNextLesson()
  const countdown = useCountdown(lesson?.startTime ?? null)

  if (loading) return <Skeleton className="h-full min-h-[7rem] rounded-lg" />

  if (!lesson) {
    // Компактное «отдыхай»-состояние. НЕ дублирует CTA «Запланировать урок»
    // из TodayLessons — это просто статус, без кнопки добавления.
    return (
      <div className="h-full rounded-lg brand-wash border border-primary/20 px-4 py-4 flex items-center gap-3 shadow-elevation-1">
        <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
          <PartyPopper size={18} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm">Ближайших уроков нет</p>
          <p className="text-xs text-muted-foreground mt-0.5">Свободное окно — можно выдохнуть</p>
        </div>
      </div>
    )
  }

  const minutesLeft = getMinutesUntil(lesson.startTime)
  const isImminent = minutesLeft <= 30 && minutesLeft > 0

  return (
    <Link href={`/calendar`} className="block h-full">
      <motion.div whileTap={{ scale: 0.97 }} className="h-full">
      <Card className="h-full brand-gradient text-white border-transparent card-hover shadow-glow">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
              <Clock size={13} />
              <span>Ближайший урок</span>
            </div>
            {/* Живой таймер — hero-treatment для ключевого числа */}
            <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full tnum ${isImminent ? 'bg-amber-400 text-amber-900' : 'bg-white/20 text-white'}`}>
              <Timer size={11} />{countdown}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-white/30">
              <AvatarImage src={lesson.student.user?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-white/20 text-white text-xs">
                {getInitials(lesson.student.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{lesson.student.name}</p>
              <p className="text-white/80 text-sm truncate">
                {lesson.subject} · {getLessonTimeRange(lesson.startTime, lesson.durationMinutes)}
              </p>
            </div>

            <ChevronRight size={18} className="text-white/60 shrink-0" />
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </Link>
  )
}
