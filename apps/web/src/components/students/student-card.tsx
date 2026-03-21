'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getInitials, formatRub, pluralize } from '@tutorflow/utils'
import { MessageCircle, ChevronRight } from 'lucide-react'
import type { StudentListItem } from '@tutorflow/types'
import { cn } from '@/lib/utils'

interface StudentCardProps {
  student: StudentListItem
  onClick: () => void
}

export function StudentCard({ student, onClick }: StudentCardProps) {
  const hasDebt = student.debtAmount > 0

  return (
    <Card
      className={cn('card-hover cursor-pointer active:scale-[0.99] transition-transform')}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Цветной индикатор */}
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: student.color ?? '#6C63FF' }}
          />

          {/* Аватар */}
          <Avatar className="w-11 h-11 shrink-0">
            <AvatarImage src={student.user?.avatarUrl ?? undefined} />
            <AvatarFallback
              className="text-sm font-semibold text-white"
              style={{ backgroundColor: student.color ?? '#6C63FF' }}
            >
              {getInitials(student.name)}
            </AvatarFallback>
          </Avatar>

          {/* Информация */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground text-sm truncate">{student.name}</p>
              {student.telegramConnected && (
                <MessageCircle
                  size={13}
                  className="shrink-0 text-[#6C63FF]"
                  aria-label="Telegram подключён"
                />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {student.subject && (
                <span className="text-xs text-muted-foreground truncate">{student.subject}</span>
              )}
              {student.subject && student.lessonsCount > 0 && (
                <span className="text-xs text-muted-foreground">·</span>
              )}
              {student.lessonsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {pluralize(student.lessonsCount, ['урок', 'урока', 'уроков'])}
                </span>
              )}
            </div>
          </div>

          {/* Правая часть */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {hasDebt && (
              <Badge variant="danger" className="text-xs">
                {formatRub(student.debtAmount)}
              </Badge>
            )}
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
