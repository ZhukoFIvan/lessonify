'use client'

import { motion } from 'framer-motion'
import { ProfileSection } from '@/components/settings/profile-section'
import { TelegramSection } from '@/components/settings/telegram-section'
import { RemindersSection } from '@/components/settings/reminders-section'
import { TariffSection } from '@/components/settings/tariff-section'
import { ReferralSection } from '@/components/settings/referral-section'
import { GoogleCalendarSection } from '@/components/settings/google-calendar-section'
import { AvailabilitySection } from '@/components/settings/availability-section'
import { BookingRequestsSection } from '@/components/settings/booking-requests-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/store/auth.store'
import { LogOut, Palette } from 'lucide-react'
import { useState, Suspense } from 'react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
})

export default function SettingsPage() {
  const { logout } = useAuth()
  const role = useAuthStore((s) => s.user?.role)
  const isTutor = role === 'TUTOR'
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  const sections = [
    <ProfileSection key="profile" />,
    <TelegramSection key="telegram" />,
    ...(isTutor ? [
      <Suspense key="gcal" fallback={null}><GoogleCalendarSection /></Suspense>,
    ] : []),
    <div key="theme" className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette size={20} className="text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Тема оформления</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Системная, светлая или тёмная
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>,
    ...(isTutor ? [
      <RemindersSection key="reminders" />,
      <AvailabilitySection key="availability" />,
      <BookingRequestsSection key="booking" />,
      <ReferralSection key="referral" />,
    ] : []),
    <TariffSection key="tariff" />,
  ]

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      <motion.div {...fadeUp(0)} className="px-4 lg:px-0 pt-5 lg:pt-0 pb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Настройки</h1>
      </motion.div>

      <div className="px-4 lg:px-0 pb-6 lg:max-w-4xl">
        <div className="flex flex-col gap-4">
          {sections.map((section, i) => (
            <motion.div key={i} {...fadeUp(0.06 + i * 0.05)}>
              {section}
            </motion.div>
          ))}

          <motion.div {...fadeUp(0.06 + sections.length * 0.05)}>
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 mt-2"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={16} />
              {loggingOut ? 'Выход...' : 'Выйти из аккаунта'}
            </Button>

            <p className="text-center text-xs text-muted-foreground pb-2 mt-4">
              Lessonify · MVP
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
