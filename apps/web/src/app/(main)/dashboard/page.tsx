'use client'

import { useAuthStore } from '@/store/auth.store'
import { GreetingHeader } from '@/components/dashboard/greeting-header'
import { NextLessonCard } from '@/components/dashboard/next-lesson-card'
import { TodayLessons } from '@/components/dashboard/today-lessons'
import { DebtorsStrip } from '@/components/dashboard/debtors-strip'
import { StudentDashboard } from '@/components/dashboard/student-dashboard'
import { TrialBanner } from '@/components/dashboard/trial-banner'

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

  // Tutor dashboard (default)
  return (
    <div className="p-4 lg:p-8">
      <GreetingHeader />
      <TrialBanner />
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <NextLessonCard />
        <div className="flex flex-col gap-5">
          <TodayLessons />
          <DebtorsStrip />
        </div>
      </div>
    </div>
  )
}
