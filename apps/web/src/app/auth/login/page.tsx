import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Вход в кабинет репетитора',
  description:
    'Войдите в Lessonify — CRM для частных репетиторов: расписание, ученики, оплаты, домашние задания и Telegram-напоминания в одном кабинете.',
  alternates: { canonical: 'https://app.lessonify.ru/auth/login' },
  robots: { index: true, follow: true },
}

export default function LoginPage() {
  return <LoginForm />
}
