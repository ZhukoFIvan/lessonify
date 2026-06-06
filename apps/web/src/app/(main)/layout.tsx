import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { Prefetcher } from '@/components/layout/prefetcher'
import { AutoRefresh } from '@/components/system/auto-refresh'

// Authenticated application area — never indexable.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background w-screen max-w-screen overflow-x-clip">
      <Prefetcher />
      <AutoRefresh />
      <Sidebar />

      <div className="flex flex-col flex-1 min-h-screen min-w-0">
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 min-w-0 animate-in fade-in duration-150">
          {/* Контентная оболочка: ограничиваем ширину и центрируем на широких экранах,
              чтобы интерфейс не превращался в «растянутый мобайл» с пустыми полями.
              Страницы сами владеют своими отступами (p-4 / lg:p-8). */}
          <div className="mx-auto w-full min-w-0 max-w-[1280px] 2xl:max-w-[1440px]">
            {children}
          </div>
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
