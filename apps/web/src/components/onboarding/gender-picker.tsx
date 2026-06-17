'use client'

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { User, Users, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Gender = 'MALE' | 'FEMALE' | 'OTHER'

const OPTIONS: { value: Gender; labelKey: string; Icon: LucideIcon }[] = [
  { value: 'MALE', labelKey: 'gender.male', Icon: User },
  { value: 'FEMALE', labelKey: 'gender.female', Icon: UserRound },
  { value: 'OTHER', labelKey: 'gender.other', Icon: Users },
]

interface GenderPickerProps {
  value: Gender | null
  onChange: (gender: Gender) => void
}

export function GenderPicker({ value, onChange }: GenderPickerProps) {
  const t = useTranslations('onboarding')
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">{t('gender.label')}</p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value: g, labelKey, Icon }) => (
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
              {t(labelKey)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
