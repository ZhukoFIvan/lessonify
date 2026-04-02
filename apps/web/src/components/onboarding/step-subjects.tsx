'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { OnboardingData } from '@/app/onboarding/page'

interface StepSubjectsProps {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const POPULAR_SUBJECTS = [
  { label: 'Математика', emoji: '📐' },
  { label: 'Английский', emoji: '🇬🇧' },
  { label: 'Русский язык', emoji: '📝' },
  { label: 'Физика', emoji: '⚛️' },
  { label: 'Химия', emoji: '🧪' },
  { label: 'Биология', emoji: '🧬' },
  { label: 'Информатика', emoji: '💻' },
  { label: 'История', emoji: '📜' },
  { label: 'Обществознание', emoji: '🏛️' },
  { label: 'Литература', emoji: '📚' },
  { label: 'Немецкий', emoji: '🇩🇪' },
  { label: 'Французский', emoji: '🇫🇷' },
  { label: 'Музыка', emoji: '🎵' },
  { label: 'Рисование', emoji: '🎨' },
  { label: 'География', emoji: '🌍' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function StepSubjects({ data, onChange, onNext, onBack }: StepSubjectsProps) {
  const [customSubject, setCustomSubject] = useState('')

  function toggleSubject(subject: string) {
    const current = data.subjects
    if (current.includes(subject)) {
      onChange({ subjects: current.filter(s => s !== subject) })
    } else {
      onChange({ subjects: [...current, subject] })
    }
  }

  function addCustom() {
    const trimmed = customSubject.trim()
    if (trimmed && !data.subjects.includes(trimmed)) {
      onChange({ subjects: [...data.subjects, trimmed] })
      setCustomSubject('')
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col px-2"
    >
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Что вы преподаёте?
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Выберите предметы — можно несколько
        </p>
      </motion.div>

      {/* Subject chips */}
      <motion.div variants={item} className="flex flex-wrap gap-2 mt-6">
        {POPULAR_SUBJECTS.map(({ label, emoji }) => {
          const selected = data.subjects.includes(label)
          return (
            <motion.button
              key={label}
              type="button"
              onClick={() => toggleSubject(label)}
              whileTap={{ scale: 0.92 }}
              layout
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all duration-200',
                selected
                  ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                  : 'bg-card border-border text-foreground hover:border-primary/40',
              )}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {selected && <X size={14} className="ml-0.5" />}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Custom subject */}
      <motion.div variants={item} className="flex gap-2 mt-4">
        <Input
          value={customSubject}
          onChange={(e) => setCustomSubject(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Свой предмет..."
          className="h-10"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustom}
          disabled={!customSubject.trim()}
          className="h-10 px-3"
        >
          <Plus size={18} />
        </Button>
      </motion.div>

      {/* Hourly rate */}
      <motion.div variants={item} className="mt-6">
        <label htmlFor="ob-rate" className="text-sm font-medium text-foreground mb-1.5 block">
          Ставка за час (₽)
        </label>
        <Input
          id="ob-rate"
          type="number"
          value={data.hourlyRate ?? ''}
          onChange={(e) => onChange({ hourlyRate: e.target.value ? Number(e.target.value) : null })}
          placeholder="1500"
          className="h-12 text-base"
          min={0}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Можно указать позже в настройках
        </p>
      </motion.div>

      {/* Navigation */}
      <motion.div variants={item} className="flex gap-3 mt-8">
        <Button variant="outline" onClick={onBack} size="lg" className="px-4">
          <ArrowLeft size={18} />
        </Button>
        <Button
          onClick={onNext}
          disabled={data.subjects.length === 0}
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
