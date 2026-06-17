import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { CalendarDays, Wallet, BookOpen, Users } from 'lucide-react'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('auth')

  const HIGHLIGHTS = [
    { icon: CalendarDays, title: t('marketing.scheduleTitle'), desc: t('marketing.scheduleDesc') },
    { icon: Wallet, title: t('marketing.moneyTitle'), desc: t('marketing.moneyDesc') },
    { icon: BookOpen, title: t('marketing.homeworkTitle'), desc: t('marketing.homeworkDesc') },
    { icon: Users, title: t('marketing.studentsTitle'), desc: t('marketing.studentsDesc') },
  ] as const

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.1fr_minmax(0,0.9fr)] xl:grid-cols-[1.2fr_minmax(0,0.8fr)]">
      {/* Левая брендовая панель — только на десктопе */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="brand-gradient absolute inset-0" />
        {/* Декоративные световые пятна */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-black/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img src="/logo.png" alt="Lessonify" className="h-11 w-11 rounded-lg shadow-elevation-2" />
          <span className="text-xl font-bold tracking-tight text-white">Lessonify</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-h1 text-white">
            {t('marketing.heroTitle')}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            {t('marketing.heroDesc')}
          </p>

          <ul className="mt-9 grid gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15 text-white">
                  <Icon size={18} />
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-snug text-white/70">{desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/55">
          <span>© {new Date().getFullYear()} Lessonify</span>
          <a href="/offer" className="hover:text-white/80 transition-colors">{t('marketing.offer')}</a>
          <a href="/privacy" className="hover:text-white/80 transition-colors">{t('marketing.privacy')}</a>
        </div>
      </aside>

      {/* Правая колонка — форма */}
      <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Мобильный логотип — на десктопе бренд уже слева */}
          <div className="surface-1 rounded-xl p-6 sm:p-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
