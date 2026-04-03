'use client'

import { motion } from 'framer-motion'
import { CalendarPlus, UserPlus, ClipboardPlus, type LucideIcon } from 'lucide-react'

interface QuickAction {
  icon: LucideIcon
  label: string
  key: string
}

const actions: QuickAction[] = [
  { key: 'lesson', icon: CalendarPlus, label: 'Урок' },
  { key: 'student', icon: UserPlus, label: 'Ученик' },
  { key: 'homework', icon: ClipboardPlus, label: 'ДЗ' },
]

interface QuickActionsProps {
  onAction: (key: string) => void
}

export function QuickActions({ onAction }: QuickActionsProps) {
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{action.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
