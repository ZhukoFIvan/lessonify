'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, BookOpen, Wallet, ClipboardCheck } from 'lucide-react'
import api from '@/lib/api'

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

const CARDS = [
  {
    key: 'students',
    label: 'Учеников',
    icon: Users,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    getValue: (s: Stats) => s.studentsCount,
    suffix: '',
  },
  {
    key: 'lessons',
    label: 'Уроков за неделю',
    icon: BookOpen,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    getValue: (s: Stats) => s.weekLessons,
    suffix: '',
  },
  {
    key: 'income',
    label: 'Доход за месяц',
    icon: Wallet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    getValue: (s: Stats) => s.monthIncome,
    suffix: ' ₽',
  },
  {
    key: 'homework',
    label: 'ДЗ на проверке',
    icon: ClipboardCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    getValue: (s: Stats) => s.pendingHomework,
    suffix: '',
  },
]

export function QuickStats() {
  const [stats, setStats] = useState<Stats>({
    studentsCount: 0,
    weekLessons: 0,
    monthIncome: 0,
    pendingHomework: 0,
  })

  useEffect(() => {
    async function load() {
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
    }

    load()
  }, [])

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
            className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={card.color} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground leading-tight">
                <AnimatedNumber value={value} />{card.suffix}
              </p>
              <p className="text-xs text-muted-foreground truncate">{card.label}</p>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
