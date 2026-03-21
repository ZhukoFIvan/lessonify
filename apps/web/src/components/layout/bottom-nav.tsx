'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Users, Wallet, Settings, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { STUDENT_TABS, TUTOR_TABS } from './constants'

export function BottomNav() {
  const pathname = usePathname()
  const role = useAuthStore((s) => s.user?.role)

  const tabs = role === 'STUDENT' ? STUDENT_TABS : TUTOR_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div
        className="bg-card border-border flex items-stretch border-t"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors duration-150',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className="transition-transform duration-150 active:scale-90"
              />
              <span
                className={cn(
                  'text-[10px] font-medium leading-none transition-all',
                  active ? 'opacity-100' : 'h-0 overflow-hidden opacity-0',
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
