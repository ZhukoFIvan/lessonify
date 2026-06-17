'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/use-auth'
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localeLabels,
  locales,
  type Locale,
} from '@/i18n/config'

// Короткие коды для сегментированного переключателя (полное имя — в title).
const CODES: Record<Locale, string> = { ru: 'RU', en: 'EN', uk: 'UK' }

export function LanguageToggle() {
  const active = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const user = useAuthStore((s) => s.user)
  const { updateProfile } = useAuth()

  function selectLocale(locale: Locale) {
    if (locale === active) return
    // Пишем выбор в first-party куку — сервер прочитает её на следующем запросе.
    // Кука важнее Accept-Language и гео, поэтому выбор «прилипает» навсегда.
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`
    // Для залогиненных — сохраняем предпочтение в БД (перенос между устройствами),
    // best-effort: не блокируем UI и игнорируем сетевые ошибки.
    if (user) void updateProfile({ locale }).catch(() => {})
    // Перерисовываем серверные компоненты (и <html lang>) с новой локалью.
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary p-1" aria-busy={isPending}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => selectLocale(locale)}
          disabled={isPending}
          title={localeLabels[locale]}
          aria-pressed={locale === active}
          className={cn(
            'rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 disabled:opacity-60',
            locale === active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary-foreground/10 hover:text-foreground',
          )}
        >
          {CODES[locale]}
        </button>
      ))}
    </div>
  )
}
