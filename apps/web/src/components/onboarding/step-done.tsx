'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/components/ui/use-toast'
import { useUpdateTutorSettings } from '@/hooks/use-tutor-settings'
import api from '@/lib/api'
import confetti from 'canvas-confetti'
import type { OnboardingData } from '@/app/onboarding/page'

interface StepDoneProps {
  data: OnboardingData
  isTutor: boolean
}

export function StepDone({ data, isTutor }: StepDoneProps) {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { update: updateTutor } = useUpdateTutorSettings()
  const [saving, setSaving] = useState(false)
  const confettiFired = useRef(false)

  useEffect(() => {
    if (confettiFired.current) return
    confettiFired.current = true

    // Respect prefers-reduced-motion: skip the confetti burst entirely.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const duration = 1500
    const end = Date.now() + duration

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFE66D'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFE66D'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    setTimeout(frame, 300)
  }, [])

  async function handleFinish() {
    setSaving(true)
    try {
      if (isTutor) {
        await updateTutor({
          ...(data.subjects.length > 0 && { subjects: data.subjects }),
          ...(data.hourlyRate !== null && { hourlyRate: data.hourlyRate }),
          ...(data.timezone && { timezone: data.timezone }),
        })
      }

      const { data: res } = await api.patch('/auth/profile', {
        name: data.name.trim(),
        gender: data.gender,
        avatarUrl: data.avatarUrl,
      })
      setUser(res.data)
      toast({ variant: 'success', title: t('done.welcomeToast') })
      router.push('/dashboard')
    } catch {
      toast({ variant: 'destructive', title: t('done.errorTitle'), description: t('done.errorDescription') })
      setSaving(false)
    }
  }

  const stats = [
    { label: t('done.statProfile'), done: true },
    ...(isTutor
      ? [
          { label: t('done.statSubjects'), done: data.subjects.length > 0 },
          { label: t('done.statStudent'), done: data.studentAdded },
        ]
      : []),
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center px-2"
    >
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500/10"
          initial={{ scale: 1 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-foreground tracking-tight"
      >
        {t('done.title')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mt-2 max-w-xs"
      >
        {isTutor
          ? t('done.subtitleTutor')
          : t('done.subtitleStudent')}
      </motion.p>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 w-full max-w-xs space-y-2"
      >
        {stats.map(({ label, done }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card border border-border"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-green-500' : 'bg-border'}`}>
              {done && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <span className="text-sm text-foreground">{label}</span>
            {done && <span className="text-xs text-green-600 dark:text-green-400 ml-auto">{t('done.ready')}</span>}
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 w-full max-w-xs"
      >
        <Button
          onClick={handleFinish}
          disabled={saving}
          size="lg"
          className="w-full group"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              {t('done.saving')}
            </>
          ) : (
            <>
              {t('done.goToDashboard')}
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
