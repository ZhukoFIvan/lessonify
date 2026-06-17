import type { Metadata, Viewport } from 'next'
// import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { Providers } from '@/components/providers'
import { AuthInitializer } from '@/components/auth/auth-initializer'

// const inter = Inter({
//   subsets: ['latin', 'cyrillic'],
//   variable: '--font-inter',
//   display: 'swap',
// })

const APP_DESCRIPTION =
  'Lessonify — ИИ-помощник и CRM для частного репетитора: уроки голосом, учёт учеников и оплат, домашние задания, Telegram-напоминания. Бесплатно до 5 учеников.'

export const metadata: Metadata = {
  metadataBase: new URL('https://app.lessonify.ru'),
  title: {
    default: 'Lessonify — ИИ-помощник репетитора',
    template: '%s — Lessonify',
  },
  description: APP_DESCRIPTION,
  applicationName: 'Lessonify',
  keywords: [
    'ИИ-помощник репетитора',
    'приложение для репетитора',
    'учёт учеников репетитора',
    'расписание для репетитора',
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
    title: 'Lessonify — ИИ-помощник репетитора',
    description: APP_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Lessonify — ИИ-помощник репетитора' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lessonify — ИИ-помощник репетитора',
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
  // Приложение закрыто от индексации: SEO-поверхность — лендинг lessonify.ru.
  // Иначе app.* конкурирует с лендингом по «CRM для репетитора» в выдаче.
  robots: {
    index: false,
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Локаль определяется на сервере (кука → Accept-Language → ru); messages
  // отдаются клиенту один раз через провайдер.
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    // <html lang={locale} className={inter.variable}>
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <AuthInitializer />
            <div className="min-h-screen">{children}</div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
