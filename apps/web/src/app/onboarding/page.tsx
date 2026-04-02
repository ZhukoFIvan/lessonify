'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { StepWelcome } from '@/components/onboarding/step-welcome'
import { StepProfile } from '@/components/onboarding/step-profile'
import { StepSubjects } from '@/components/onboarding/step-subjects'
import { StepFirstStudent } from '@/components/onboarding/step-first-student'
import { StepTelegram } from '@/components/onboarding/step-telegram'
import { StepDone } from '@/components/onboarding/step-done'

export interface OnboardingData {
  name: string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  avatarUrl: string
  subjects: string[]
  hourlyRate: number | null
  studentAdded: boolean
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
}

export default function OnboardingPage() {
  const { user } = useAuthStore()
  const isTutor = user?.role === 'TUTOR'

  const steps = isTutor
    ? ['welcome', 'profile', 'subjects', 'student', 'telegram', 'done'] as const
    : ['welcome', 'profile', 'telegram', 'done'] as const

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const [data, setData] = useState<OnboardingData>({
    name: user?.name ?? '',
    gender: (user?.gender as OnboardingData['gender']) ?? null,
    avatarUrl: user?.avatarUrl ?? `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(user?.name ?? 'User')}&backgroundColor=b6e3f4&radius=50`,
    subjects: [],
    hourlyRate: null,
    studentAdded: false,
  })

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [])

  const next = useCallback(() => {
    setDirection(1)
    setStepIndex(prev => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  const back = useCallback(() => {
    setDirection(-1)
    setStepIndex(prev => Math.max(prev - 1, 0))
  }, [])

  const currentStep = steps[stepIndex]
  const progress = ((stepIndex) / (steps.length - 1)) * 100

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Progress bar */}
      {stepIndex > 0 && stepIndex < steps.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="h-1 bg-border">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary-foreground/50"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-lg"
          >
            {currentStep === 'welcome' && (
              <StepWelcome onNext={next} userName={user?.name} />
            )}
            {currentStep === 'profile' && (
              <StepProfile
                data={data}
                onChange={updateData}
                onNext={next}
                onBack={back}
              />
            )}
            {currentStep === 'subjects' && (
              <StepSubjects
                data={data}
                onChange={updateData}
                onNext={next}
                onBack={back}
              />
            )}
            {currentStep === 'student' && (
              <StepFirstStudent
                data={data}
                onChange={updateData}
                onNext={next}
                onBack={back}
              />
            )}
            {currentStep === 'telegram' && (
              <StepTelegram
                onNext={next}
                onBack={back}
              />
            )}
            {currentStep === 'done' && (
              <StepDone data={data} isTutor={isTutor} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
