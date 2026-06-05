import type { ReactNode } from 'react'
import { CalendarDays, Wallet, BookOpen, Users } from 'lucide-react'

const HIGHLIGHTS = [
  { icon: CalendarDays, title: 'Расписание без хаоса', desc: 'Все уроки, переносы и напоминания в одном календаре.' },
  { icon: Wallet, title: 'Деньги под контролем', desc: 'Оплаты, долги и доход за месяц — наглядно и точно.' },
  { icon: BookOpen, title: 'Домашка и прогресс', desc: 'Задания, проверка и история занятий у каждого ученика.' },
  { icon: Users, title: 'Ученики рядом', desc: 'Профили, контакты и заметки — ничего не потеряется.' },
] as const

export default function AuthLayout({ children }: { children: ReactNode }) {
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
            CRM для репетиторов, в которой приятно работать
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/75">
            Расписание, оплаты, домашние задания и ученики — собрано в одном месте.
            Меньше рутины, больше уроков.
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
          <a href="/offer" className="hover:text-white/80 transition-colors">Публичная оферта</a>
          <a href="/privacy" className="hover:text-white/80 transition-colors">Политика конфиденциальности</a>
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
