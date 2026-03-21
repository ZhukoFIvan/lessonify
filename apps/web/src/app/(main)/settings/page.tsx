'use client'

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

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      {/* ── Заголовок ── */}
      <div className="px-4 lg:px-0 pt-5 lg:pt-0 pb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Настройки</h1>
      </div>

      <div className="px-4 lg:px-0 pb-6 lg:max-w-4xl">
        <div className="flex flex-col gap-4">
          {/* Профиль */}
          <ProfileSection />

          {/* Telegram */}
          <TelegramSection />

          {/* Google Calendar (только репетитор) */}
          {isTutor && (
            <Suspense fallback={null}>
              <GoogleCalendarSection />
            </Suspense>
          )}

          {/* Тема */}
          <div className="rounded-2xl bg-card border border-border p-4">
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
          </div>

          {/* Напоминания (только репетитор) */}
          {isTutor && <RemindersSection />}

          {/* Расписание записи (только репетитор) */}
          {isTutor && <AvailabilitySection />}

          {/* Запросы на запись (только репетитор) */}
          {isTutor && <BookingRequestsSection />}

          {/* Реферальная программа (только репетитор) */}
          {isTutor && <ReferralSection />}

          {/* Тариф */}
          <TariffSection />

          {/* Выход */}
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 mt-2"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={16} />
            {loggingOut ? 'Выход...' : 'Выйти из аккаунта'}
          </Button>

          <p className="text-center text-xs text-muted-foreground pb-2">
            Lessonify · MVP
          </p>
        </div>
      </div>
    </div>
  )
}
