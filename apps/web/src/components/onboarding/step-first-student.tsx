'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, UserPlus, Check, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useCreateStudent } from '@/hooks/use-students'
import { toast } from '@/components/ui/use-toast'
import type { OnboardingData } from '@/app/onboarding/page'

interface StepFirstStudentProps {
  data: OnboardingData
  onChange: (patch: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const COLORS = [
  '#6C63FF', '#FF6B6B', '#4ECDC4', '#FFE66D',
  '#A8E6CF', '#FF8A80', '#82B1FF', '#B388FF',
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function StepFirstStudent({ data, onChange, onNext, onBack }: StepFirstStudentProps) {
  const { createStudent, loading } = useCreateStudent()

  const [studentName, setStudentName] = useState('')
  const [studentSubject, setStudentSubject] = useState(data.subjects[0] ?? '')
  const [studentColor, setStudentColor] = useState(COLORS[0])
  const [added, setAdded] = useState(data.studentAdded)

  async function handleAdd() {
    if (!studentName.trim()) return

    try {
      await createStudent({
        name: studentName.trim(),
        subject: studentSubject || undefined,
        color: studentColor,
        hourlyRate: data.hourlyRate ?? undefined,
      })
      setAdded(true)
      onChange({ studentAdded: true })
      toast({ variant: 'success', title: 'Ученик добавлен!' })
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Попробуйте ещё раз' })
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
          Добавьте первого ученика
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Можно пропустить и добавить позже
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!added ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-4 mt-6"
          >
            {/* Student name */}
            <motion.div variants={item}>
              <label htmlFor="ob-student" className="text-sm font-medium text-foreground mb-1.5 block">
                Имя ученика
              </label>
              <Input
                id="ob-student"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Анна Петрова"
                className="h-12 text-base"
                autoFocus
              />
            </motion.div>

            {/* Subject (prefilled from step 3) */}
            <motion.div variants={item}>
              <label htmlFor="ob-student-subject" className="text-sm font-medium text-foreground mb-1.5 block">
                Предмет
              </label>
              {data.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.subjects.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStudentSubject(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-full border text-sm transition-all',
                        studentSubject === s
                          ? 'bg-primary text-white border-primary'
                          : 'bg-card border-border text-foreground hover:border-primary/40',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  id="ob-student-subject"
                  value={studentSubject}
                  onChange={(e) => setStudentSubject(e.target.value)}
                  placeholder="Математика"
                  className="h-10"
                />
              )}
            </motion.div>

            {/* Color */}
            <motion.div variants={item}>
              <p className="text-sm font-medium text-foreground mb-2">Цвет</p>
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <motion.button
                    key={color}
                    type="button"
                    onClick={() => setStudentColor(color)}
                    whileTap={{ scale: 0.85 }}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      studentColor === color ? 'border-foreground scale-110' : 'border-transparent',
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Add button */}
            <motion.div variants={item}>
              <Button
                onClick={handleAdd}
                disabled={!studentName.trim() || loading}
                size="lg"
                className="w-full"
              >
                <UserPlus size={18} className="mr-2" />
                {loading ? 'Добавление...' : 'Добавить ученика'}
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center mt-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
            >
              <Check size={32} className="text-green-500" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground">Отлично!</p>
            <p className="text-muted-foreground text-sm mt-1">
              {studentName} добавлен(а) в список учеников
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <motion.div variants={item} className="flex gap-3 mt-8">
        <Button variant="outline" onClick={onBack} size="lg" className="px-4">
          <ArrowLeft size={18} />
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          variant={added ? 'default' : 'outline'}
          className="flex-1 group"
        >
          {added ? (
            <>
              Далее
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </>
          ) : (
            <>
              <SkipForward size={18} className="mr-2" />
              Пропустить
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
