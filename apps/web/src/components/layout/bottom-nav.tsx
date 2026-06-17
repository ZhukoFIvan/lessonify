'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { STUDENT_TABS, TUTOR_TABS } from './constants'

export function BottomNav() {
  const pathname = usePathname()
  const role = useAuthStore((s) => s.user?.role)
  const tNav = useTranslations('nav')

  const tabs = role === 'STUDENT' ? STUDENT_TABS : TUTOR_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      {/* Плавное затухание контента под таб-баром */}
      <div className="pointer-events-none h-3 bg-gradient-to-t from-background to-transparent" />
      <div
        className="flex items-stretch border-t border-[var(--border-subtle)] bg-surface-1/95 px-1 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs.map(({ href, icon: Icon, labelKey }) => {
          const label = tNav(labelKey)
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <span
                className={cn(
                  'flex h-8 w-full max-w-[60px] items-center justify-center rounded-full transition-colors duration-150',
                  active ? 'bg-[hsl(var(--primary)/0.14)]' : 'group-active:bg-surface-2',
                )}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={cn(
                    'shrink-0 transition-transform duration-150 group-active:scale-90',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </span>
              <span
                className={cn(
                  'max-w-full truncate px-0.5 text-[10px] font-semibold leading-none transition-colors duration-150',
                  active ? 'text-primary' : 'text-muted-foreground',
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
