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

export const metadata: Metadata = {
  title: 'Lessonify — умный помощник репетитора',
  description: 'Управляйте расписанием, учениками и оплатами в одном месте',
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
