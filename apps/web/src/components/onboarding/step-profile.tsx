'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, User, UserRound, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarPicker } from '@/components/onboarding/avatar-picker'
import { cn } from '@/lib/utils'
import type { OnboardingData } from '@/app/onboarding/page'
import type { LucideIcon } from 'lucide-react'

interface StepProfileProps {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

type Gender = 'MALE' | 'FEMALE' | 'OTHER'

const GENDER_OPTIONS: { value: Gender; label: string; Icon: LucideIcon }[] = [
  { value: 'MALE', label: 'Мужской', Icon: User },
  { value: 'FEMALE', label: 'Женский', Icon: UserRound },
  { value: 'OTHER', label: 'Другой', Icon: Users },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function StepProfile({ data, onChange, onNext, onBack }: StepProfileProps) {
  const isValid = data.name.trim().length >= 2 && data.gender !== null

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col px-2"
    >
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Расскажите о себе
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Эта информация поможет персонализировать приложение
        </p>
      </motion.div>

      {/* Name */}
      <motion.div variants={item} className="mt-6">
        <label htmlFor="ob-name" className="text-sm font-medium text-foreground mb-1.5 block">
          Ваше имя
        </label>
        <Input
          id="ob-name"
          value={data.name}
          onChange={(e) => {
            onChange({ name: e.target.value })
            if (data.avatarUrl.includes('api.dicebear.com')) {
              onChange({
                name: e.target.value,
                avatarUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(e.target.value)}&backgroundColor=b6e3f4&radius=50`,
              })
            }
          }}
          placeholder="Иван Иванов"
          autoFocus
          className="h-12 text-base"
        />
      </motion.div>

      {/* Gender */}
      <motion.div variants={item} className="mt-5">
        <p className="text-sm font-medium text-foreground mb-2">Пол</p>
        <div className="grid grid-cols-3 gap-2">
          {GENDER_OPTIONS.map(({ value, label, Icon }) => (
            <motion.button
              key={value}
              type="button"
              onClick={() => onChange({ gender: value })}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3.5 px-2 transition-all duration-200',
                data.gender === value
                  ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/30',
              )}
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors',
                  data.gender === value ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  data.gender === value ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Avatar */}
      <motion.div variants={item} className="mt-5">
        <AvatarPicker
          value={data.avatarUrl}
          onChange={(url) => onChange({ avatarUrl: url })}
          userName={data.name}
        />
      </motion.div>

      {/* Navigation */}
      <motion.div variants={item} className="flex gap-3 mt-8">
        <Button variant="outline" onClick={onBack} size="lg" className="px-4">
          <ArrowLeft size={18} />
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          size="lg"
          className="flex-1 group"
        >
          Далее
          <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
