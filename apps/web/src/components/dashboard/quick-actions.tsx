'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CalendarPlus, UserPlus, ClipboardPlus, type LucideIcon } from 'lucide-react'

interface QuickAction {
  icon: LucideIcon
  label: string
  /** Полное название действия — для aria-label и тултипа */
  title: string
  key: string
  primary?: boolean
}

interface QuickActionsProps {
  onAction: (key: string) => void
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const t = useTranslations('dashboard')

  const actions: QuickAction[] = [
    { key: 'lesson', icon: CalendarPlus, label: t('quickActions.lesson.label'), title: t('quickActions.lesson.title'), primary: true },
    { key: 'student', icon: UserPlus, label: t('quickActions.student.label'), title: t('quickActions.student.title') },
    { key: 'homework', icon: ClipboardPlus, label: t('quickActions.homework.label'), title: t('quickActions.homework.title') },
  ]

  return (
    <div className="flex gap-2">
      {actions.map((action, i) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
            onClick={() => onAction(action.key)}
            aria-label={action.title}
            title={action.title}
            className={
              action.primary
                ? 'flex items-center gap-1.5 px-3.5 py-2 rounded-md brand-gradient text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-105 transition-all active:scale-95'
                : 'flex items-center gap-1.5 px-3 py-2 rounded-md border border-[var(--border-subtle)] bg-card text-sm font-medium text-foreground hover:bg-surface-2 hover:border-primary/40 hover:text-primary transition-colors active:scale-95'
            }
          >
            <Icon size={15} className="shrink-0" />
            {/* Подпись видна всегда — раньше пряталась на мобиле */}
            <span>{action.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
