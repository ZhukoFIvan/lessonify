'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Crown, Sparkles, Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBilling } from '@/hooks/use-billing'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface StepPlanProps {
  onNext: () => void
  onBack: () => void
}

const FREE_FEATURES = [
  { text: 'До 5 учеников', included: true },
  { text: 'Расписание и календарь', included: true },
  { text: 'Учёт оплат', included: true },
  { text: 'Домашние задания', included: true },
  { text: 'Telegram-уведомления', included: true },
  { text: 'Безлимит учеников', included: false },
  { text: 'Google Calendar', included: false },
  { text: 'PDF-счета', included: false },
]

const PRO_FEATURES = [
  { text: 'Неограниченное число учеников', included: true },
  { text: 'Расписание и календарь', included: true },
  { text: 'Учёт оплат', included: true },
  { text: 'Домашние задания', included: true },
  { text: 'Telegram-уведомления', included: true },
  { text: 'Google Calendar синхронизация', included: true },
  { text: 'Генерация PDF-счетов', included: true },
  { text: 'Приоритетная поддержка', included: true },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function StepPlan({ onNext, onBack }: StepPlanProps) {
  const { activateTrial, loading } = useBilling()
  const [selected, setSelected] = useState<'free' | 'pro'>('pro')

  const handleTrial = async () => {
    const ok = await activateTrial()
    if (ok) {
      toast({ variant: 'success', title: 'PRO на 30 дней активирован!' })
    }
    onNext()
  }

  const handleSkip = () => {
    onNext()
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col px-2"
    >
      <motion.div variants={item} className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
          <Crown size={28} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Выберите план
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Начните бесплатно или попробуйте все возможности PRO
        </p>
      </motion.div>

      {/* Plan cards */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 mt-6">
        {/* FREE */}
        <button
          type="button"
          onClick={() => setSelected('free')}
          className={cn(
            'flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200',
            selected === 'free'
              ? 'border-primary bg-primary/5'
              : 'border-border bg-card hover:border-primary/30',
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Zap size={14} className="text-muted-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">FREE</span>
          </div>
          <p className="text-xl font-bold text-foreground">0 ₽</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">навсегда</p>
          <div className="mt-3 space-y-1.5">
            {FREE_FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-1.5">
                {f.included ? (
                  <Check size={11} className="text-primary shrink-0" />
                ) : (
                  <X size={11} className="text-muted-foreground/40 shrink-0" />
                )}
                <span className={cn('text-[11px]', f.included ? 'text-muted-foreground' : 'text-muted-foreground/40 line-through')}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </button>

        {/* PRO */}
        <button
          type="button"
          onClick={() => setSelected('pro')}
          className={cn(
            'flex flex-col rounded-2xl border-2 p-4 text-left transition-all duration-200 relative',
            selected === 'pro'
              ? 'border-amber-500 bg-amber-500/5'
              : 'border-border bg-card hover:border-amber-500/30',
          )}
        >
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white">
            30 дней бесплатно
          </span>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Crown size={14} className="text-amber-500" />
            </div>
            <span className="text-sm font-bold text-foreground">PRO</span>
          </div>
          <p className="text-xl font-bold text-foreground">499 ₽</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">в месяц, после триала</p>
          <div className="mt-3 space-y-1.5">
            {PRO_FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-1.5">
                <Check size={11} className="text-amber-500 shrink-0" />
                <span className="text-[11px] text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </button>
      </motion.div>

      {/* Actions */}
      <motion.div variants={item} className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack} size="lg" className="px-4">
          <ArrowLeft size={18} />
        </Button>
        {selected === 'pro' ? (
          <Button
            onClick={handleTrial}
            disabled={loading}
            size="lg"
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white group"
          >
            <Sparkles size={16} className="mr-2" />
            {loading ? 'Активация...' : 'Попробовать PRO бесплатно'}
          </Button>
        ) : (
          <Button
            onClick={handleSkip}
            size="lg"
            className="flex-1 group"
          >
            Продолжить на FREE
            <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </motion.div>
    </motion.div>
  )
}
