import type { ReactNode } from 'react'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { Prefetcher } from '@/components/layout/prefetcher'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background w-screen max-w-screen overflow-x-clip">
      <Prefetcher />
      <Sidebar />

      <div className="flex flex-col flex-1 min-h-screen">
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 min-w-0 animate-in fade-in duration-150">
          {children}
        </main>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
