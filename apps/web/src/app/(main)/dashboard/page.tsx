'use client'

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
import { HomeworkOverview } from '@/components/dashboard/homework-overview'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role)

  if (role === 'STUDENT') {
    return (
      <div className="lg:p-8">
        <GreetingHeader />
        <StudentDashboard />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <GreetingHeader />
        <QuickActions />
      </div>

      <TrialBanner />

      {/* Stats */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
        <QuickStats />
      </motion.div>

      {/* Main row — 3 equal cards */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.12 }}>
          <NextLessonCard />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
          <TodayLessons />
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.28 }}>
          <HomeworkOverview />
        </motion.div>
      </div>

      {/* Debtors — full width below */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.36 }} className="mt-5">
        <DebtorsStrip />
      </motion.div>
    </div>
  )
}
