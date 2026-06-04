'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { GreetingHeader } from '@/components/dashboard/greeting-header'
import { NextLessonCard } from '@/components/dashboard/next-lesson-card'
import { TodayLessons } from '@/components/dashboard/today-lessons'
import { DebtorsStrip } from '@/components/dashboard/debtors-strip'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { TrialBanner } from '@/components/dashboard/trial-banner'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ActionCards } from '@/components/dashboard/action-cards'
import { HomeworkOverview } from '@/components/dashboard/homework-overview'
import { AddLessonModal } from '@/components/lesson/add-lesson-modal'
import { AddStudentModal } from '@/components/students/add-student-modal'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role)
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [studentModalOpen, setStudentModalOpen] = useState(false)

  if (role === 'STUDENT') {
    return (
      <div className="lg:p-8">
        <GreetingHeader />
        <StudentDashboard />
      </div>
    )
  }

  function handleQuickAction(key: string) {
    if (key === 'lesson') setLessonModalOpen(true)
    if (key === 'student') setStudentModalOpen(true)
    if (key === 'homework') window.location.href = '/homework'
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Ограничиваем ширину контента — на больших мониторах не растягиваем в пустоту */}
      <div className="mx-auto w-full max-w-screen-xl">
        {/* Header row — stacks vertically on mobile */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <GreetingHeader />
          <QuickActions onAction={handleQuickAction} />
        </div>

        <TrialBanner />

        {/* Stats */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="mt-4">
          <QuickStats />
        </motion.div>

        {/* Main row — 3 equal cards */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3 items-stretch">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.12 }} className="h-full">
            <NextLessonCard />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="h-full">
            <TodayLessons />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.28 }} className="h-full">
            <HomeworkOverview />
          </motion.div>
        </div>

        {/* Должники — во всю ширину, внутри раскладываются в несколько колонок */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.36 }} className="mt-6">
          <DebtorsStrip />
        </motion.div>

        {/* Быстрые действия — якорят нижнюю зону, 3-колоночная сетка на десктопе */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.42 }} className="mt-6">
          <ActionCards onAction={handleQuickAction} />
        </motion.div>
      </div>

      {/* Modals triggered by quick actions */}
      <AddLessonModal
        open={lessonModalOpen}
        onClose={() => setLessonModalOpen(false)}
      />
      <AddStudentModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
      />
    </div>
  )
}
