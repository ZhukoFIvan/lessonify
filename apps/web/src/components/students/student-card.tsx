'use client'

import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials, formatRub } from '@tutorflow/utils'
import { MessageCircle, BookOpen, Wallet, ArrowUpRight } from 'lucide-react'
import type { StudentListItem } from '@tutorflow/types'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useFormatters } from '@/i18n/use-formatters'

interface StudentCardProps {
  student: StudentListItem
  onClick: () => void
}

export function StudentCard({ student, onClick }: StudentCardProps) {
  const t = useTranslations('students')
  const f = useFormatters()
  const hasDebt = student.debtAmount > 0
  const accent = student.color ?? '#6C63FF'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-lg text-left',
        'bg-card border border-[var(--border-subtle)] shadow-elevation-1',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-elevation-2',
        'active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {/* Цветной акцент-кант слева */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-center gap-3 p-3.5 pl-4">
        {/* Аватар */}
        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-[var(--border-subtle)]">
          <AvatarImage src={student.user?.avatarUrl ?? undefined} />
          <AvatarFallback
            className="text-sm font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            {getInitials(student.name)}
          </AvatarFallback>
        </Avatar>

        {/* Имя + предмет */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
            {student.telegramConnected && (
              <MessageCircle
                size={13}
                className="shrink-0 text-primary"
                aria-label={t('card.telegramConnected')}
              />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {student.subject || t('card.noSubject')}
          </p>
        </div>

        {/* Стрелка-индикатор открытия */}
        <ArrowUpRight
          size={18}
          className="shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
        />
      </div>

      {/* Метрики-подвал */}
      <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen size={13} className="shrink-0 text-muted-foreground/70" />
          <span className="font-medium text-foreground/80 tnum">
            {student.lessonsCount > 0
              ? f.count(student.lessonsCount, 'lessons')
              : t('card.noLessons')}
          </span>
        </div>

        {student.hourlyRate ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-muted-foreground/40">·</span>
            <Wallet size={13} className="shrink-0 text-muted-foreground/70" />
            <span className="font-medium text-foreground/80 tnum">{formatRub(student.hourlyRate)}{t('perHour')}</span>
          </div>
        ) : null}

        {hasDebt && (
          <Badge variant="danger" className="ml-auto tnum">
            {t('card.debt', { amount: formatRub(student.debtAmount) })}
          </Badge>
        )}
      </div>
    </motion.button>
  )
}
