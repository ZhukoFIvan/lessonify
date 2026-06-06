'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Wallet, ClipboardCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useRefreshOnTick } from '@/hooks/use-refresh-tick'

interface Stats {
  studentsCount: number
  weekLessons: number
  monthIncome: number
  pendingHomework: number
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 600
    const start = Date.now()
    const from = 0

    function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [value])

  return <>{display.toLocaleString('ru-RU')}</>
}

interface CardDef {
  key: string
  label: string
  icon: LucideIcon
  color: string
  bg: string
  getValue: (s: Stats) => number
  unit?: string
  /** accent — главная метрика, выделяется brand-вошем и hero-числом */
  accent?: boolean
}

const CARDS: CardDef[] = [
  {
    key: 'income',
    label: 'Доход за месяц',
    icon: Wallet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    getValue: (s: Stats) => s.monthIncome,
    unit: '₽',
    accent: true,
  },
  {
    key: 'students',
    label: 'Учеников',
    icon: Users,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    getValue: (s: Stats) => s.studentsCount,
  },
  {
    key: 'lessons',
    label: 'Уроков за неделю',
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    getValue: (s: Stats) => s.weekLessons,
  },
  {
    key: 'homework',
    label: 'ДЗ на проверке',
    icon: ClipboardCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    getValue: (s: Stats) => s.pendingHomework,
  },
]

export function QuickStats() {
  const [stats, setStats] = useState<Stats>({
    studentsCount: 0,
    weekLessons: 0,
    monthIncome: 0,
    pendingHomework: 0,
  })

  const load = useCallback(async () => {
      try {
        const [studentsRes, summaryRes, homeworkRes] = await Promise.allSettled([
          api.get('/students?limit=1'),
          api.get('/payments/summary?months=1'),
          api.get('/homework/stats'),
        ])

        const studentsCount =
          studentsRes.status === 'fulfilled'
            ? (studentsRes.value.data.meta?.total ?? studentsRes.value.data.data?.length ?? 0)
            : 0

        let monthIncome = 0
        let weekLessons = 0
        if (summaryRes.status === 'fulfilled') {
          const current = summaryRes.value.data.data?.current
          monthIncome = current?.received ?? 0
          weekLessons = current?.lessonsCompleted ?? current?.lessonsTotal ?? 0
        }

        const pendingHomework =
          homeworkRes.status === 'fulfilled'
            ? (homeworkRes.value.data.data?.submitted ?? 0)
            : 0

        setStats({ studentsCount, weekLessons, monthIncome, pendingHomework })
      } catch {
        // silently fail
      }
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useRefreshOnTick(() => load()) // тихое фоновое обновление дашборда

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {CARDS.map((card) => {
        const Icon = card.icon
        const value = card.getValue(stats)
        return (
          <motion.div
            key={card.key}
            variants={item}
            className={cn(
              'relative flex flex-col gap-3 p-4 rounded-lg transition-all duration-200',
              card.accent
                ? 'brand-wash border border-primary/25 shadow-elevation-1'
                : 'bg-card border border-[var(--border-subtle)] shadow-elevation-1 hover:bg-surface-2 hover:shadow-elevation-2 hover:-translate-y-0.5',
            )}
          >
            <div className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center shrink-0',
              card.accent ? 'bg-primary/15 text-primary' : card.bg,
            )}>
              <Icon size={18} className={card.accent ? 'text-primary' : card.color} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="inline-flex items-baseline gap-1 stat-number text-foreground">
                <span className="truncate">
                  <AnimatedNumber value={value} />
                </span>
                {card.unit && <span className="hero-unit shrink-0">{card.unit}</span>}
              </p>
              {/* Полная подпись: переносится на 2 строки вместо обрезки */}
              <p className="text-xs font-medium text-muted-foreground leading-snug">
                {card.label}
              </p>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
