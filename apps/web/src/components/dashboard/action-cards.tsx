'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { UserPlus, CalendarPlus, ClipboardPlus, ArrowRight, type LucideIcon } from 'lucide-react'

interface ActionDef {
  key: string
  icon: LucideIcon
  title: string
  desc: string
  color: string
  bg: string
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

interface ActionCardsProps {
  onAction: (key: string) => void
}

export function ActionCards({ onAction }: ActionCardsProps) {
  const t = useTranslations('dashboard')

  const ACTIONS: ActionDef[] = [
    { key: 'student', icon: UserPlus, title: t('actionCards.student.title'), desc: t('actionCards.student.desc'), color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { key: 'lesson', icon: CalendarPlus, title: t('actionCards.lesson.title'), desc: t('actionCards.lesson.desc'), color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'homework', icon: ClipboardPlus, title: t('actionCards.homework.title'), desc: t('actionCards.homework.desc'), color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">{t('quickActionsTitle')}</h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-3"
      >
        {ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <motion.button
              key={a.key}
              variants={item}
              onClick={() => onAction(a.key)}
              className="group text-left card-hover rounded-lg bg-card border border-[var(--border-subtle)] shadow-elevation-1 p-5 flex flex-col gap-3"
            >
              <div className={`w-11 h-11 rounded-md ${a.bg} flex items-center justify-center`}>
                <Icon size={22} className={a.color} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  {a.title}
                  <ArrowRight
                    size={14}
                    className="text-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
