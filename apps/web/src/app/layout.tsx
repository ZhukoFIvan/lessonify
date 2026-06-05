import type { Metadata, Viewport } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AuthInitializer } from '@/components/auth/auth-initializer'

// const inter = Inter({
//   subsets: ['latin', 'cyrillic'],
//   variable: '--font-inter',
//   display: 'swap',
// })

const APP_DESCRIPTION =
  'Lessonify — CRM для частных репетиторов: расписание, учёт учеников и оплат, домашние задания, Telegram-напоминания. Бесплатно до 5 учеников.'

export const metadata: Metadata = {
  metadataBase: new URL('https://app.lessonify.ru'),
  title: {
    default: 'Lessonify — CRM для репетиторов',
    template: '%s — Lessonify',
  },
  description: APP_DESCRIPTION,
  applicationName: 'Lessonify',
  keywords: [
    'CRM для репетитора',
    'программа для репетитора',
    'учёт учеников репетитора',
    'расписание для репетитора',
    'приложение для репетитора',
    'журнал репетитора',
    'учёт оплат репетитор',
    'репетитор онлайн-кабинет',
  ],
  authors: [{ name: 'Жуков Иван Андреевич' }],
  creator: 'Жуков Иван Андреевич',
  publisher: 'Lessonify',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lessonify',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Lessonify',
    locale: 'ru_RU',
    url: 'https://app.lessonify.ru/',
    title: 'Lessonify — CRM для репетиторов',
    description: APP_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Lessonify — CRM для репетиторов' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lessonify — CRM для репетиторов',
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#6C63FF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // <html lang="ru" className={inter.variable}>
    <html lang="ru">
      <body>
        <Providers>
          <AuthInitializer />
          <div className="min-h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
