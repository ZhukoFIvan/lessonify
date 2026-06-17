import { BookOpen, CalendarDays, GraduationCap, Home, Settings, Users, Wallet } from 'lucide-react'

// labelKey — ключ в словаре nav.* (см. src/i18n/messages/*.json), а не готовая строка:
// подпись переводится в момент рендера через useTranslations('nav').
export const TUTOR_TABS = [
  { href: '/dashboard', icon: Home, labelKey: 'dashboard' },
  { href: '/calendar', icon: CalendarDays, labelKey: 'calendar' },
  { href: '/students', icon: Users, labelKey: 'students' },
  { href: '/finances', icon: Wallet, labelKey: 'finances' },
  { href: '/homework', icon: BookOpen, labelKey: 'homework' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
] as const

export const STUDENT_TABS = [
  { href: '/dashboard', icon: Home, labelKey: 'dashboard' },
  { href: '/calendar', icon: CalendarDays, labelKey: 'calendar' },
  { href: '/teachers', icon: GraduationCap, labelKey: 'teachers' },
  { href: '/homework', icon: BookOpen, labelKey: 'homework' },
  { href: '/settings', icon: Settings, labelKey: 'settings' },
] as const