'use client'

import { motion } from 'framer-motion'
import { CalendarPlus, UserPlus, ClipboardPlus } from 'lucide-react'
import Link from 'next/link'

const actions = [
  { href: '/calendar', icon: CalendarPlus, label: 'Урок' },
  { href: '/students', icon: UserPlus, label: 'Ученик' },
  { href: '/homework', icon: ClipboardPlus, label: 'ДЗ' },
]

export function QuickActions() {
  return (
    <div className="flex gap-2">
      {actions.map((action, i) => {
        const Icon = action.icon
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
          >
            <Link
              href={action.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{action.label}</span>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
