'use client'

import { cn } from '@/lib/utils'
import { User, Users, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Gender = 'MALE' | 'FEMALE' | 'OTHER'

const OPTIONS: { value: Gender; label: string; Icon: LucideIcon }[] = [
  { value: 'MALE', label: 'Мужской', Icon: User },
  { value: 'FEMALE', label: 'Женский', Icon: UserRound },
  { value: 'OTHER', label: 'Другой', Icon: Users },
]

interface GenderPickerProps {
  value: Gender | null
  onChange: (gender: Gender) => void
}

export function GenderPicker({ value, onChange }: GenderPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">Пол</p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value: g, label, Icon }) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 px-2 transition-all duration-150',
              value === g
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card',
            )}
          >
            <Icon
              size={24}
              className={cn(value === g ? 'text-primary' : 'text-muted-foreground')}
            />
            <span className={cn('text-xs font-medium', value === g ? 'text-primary' : 'text-muted-foreground')}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
