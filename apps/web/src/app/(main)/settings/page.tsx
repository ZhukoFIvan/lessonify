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

  // Тема оформления — компактная карточка под новую систему поверхностей.
  const themeCard = (
    <div className="surface-1 rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
            <Palette size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Тема оформления</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Системная, светлая или тёмная
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  )

  // Левая колонка — личное (профиль, тема, тариф).
  const leftColumn = [
    <ProfileSection key="profile" />,
    <div key="theme">{themeCard}</div>,
    ...(isTutor ? [<TariffSection key="tariff" />] : []),
  ]

  // Правая колонка — интеграции и инструменты.
  const rightColumn = [
    <TelegramSection key="telegram" />,
    ...(isTutor ? [
      <Suspense key="gcal" fallback={null}><GoogleCalendarSection /></Suspense>,
      <RemindersSection key="reminders" />,
      <AvailabilitySection key="availability" />,
      <BookingRequestsSection key="booking" />,
      <ReferralSection key="referral" />,
    ] : []),
  ]

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="px-4 lg:px-0 pt-5 lg:pt-0 pb-5">
          <h1 className="text-h1 lg:text-display text-foreground">Настройки</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Профиль, оформление, тариф и интеграции
          </p>
        </motion.div>

        <div className="px-4 lg:px-0 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 lg:items-start">
            {/* Left column */}
            <div className="flex flex-col gap-4 lg:gap-5">
              {leftColumn.map((section, i) => (
                <motion.div key={i} {...fadeUp(0.06 + i * 0.05)}>
                  {section}
                </motion.div>
              ))}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4 lg:gap-5">
              {rightColumn.map((section, i) => (
                <motion.div key={i} {...fadeUp(0.06 + (leftColumn.length + i) * 0.05)}>
                  {section}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            {...fadeUp(0.06 + (leftColumn.length + rightColumn.length) * 0.05)}
            className="mt-6 lg:mt-8 lg:max-w-md lg:mx-auto"
          >
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/50"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={16} />
              {loggingOut ? 'Выход...' : 'Выйти из аккаунта'}
            </Button>

            <div className="flex items-center justify-center gap-3 pb-2 mt-5">
              <p className="text-xs text-muted-foreground">Lessonify · MVP</p>
              <span className="text-border text-xs">·</span>
              <a href="/offer" target="_blank" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Оферта</a>
              <span className="text-border text-xs">·</span>
              <a href="/privacy" target="_blank" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Конфиденциальность</a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
