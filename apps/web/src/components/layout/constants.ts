import { BookOpen, CalendarDays, GraduationCap, Home, Settings, Users, Wallet } from 'lucide-react'

export const TUTOR_TABS = [
  { href: '/dashboard', icon: Home, label: 'Главная' },
  { href: '/calendar', icon: CalendarDays, label: 'Расписание' },
  { href: '/students', icon: Users, label: 'Ученики' },
  { href: '/finances', icon: Wallet, label: 'Финансы' },
  { href: '/homework', icon: BookOpen, label: 'ДЗ' },
  { href: '/settings', icon: Settings, label: 'Настройки' },
] as const

export const STUDENT_TABS = [
  { href: '/dashboard', icon: Home, label: 'Главная' },
  { href: '/calendar', icon: CalendarDays, label: 'Расписание' },
  { href: '/teachers', icon: GraduationCap, label: 'Преподаватели' },
  { href: '/homework', icon: BookOpen, label: 'ДЗ' },
  { href: '/settings', icon: Settings, label: 'Настройки' },
] as const