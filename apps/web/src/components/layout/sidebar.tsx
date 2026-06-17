'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { BrandLogo } from '@/components/ui/brand-logo'
import { STUDENT_TABS, TUTOR_TABS } from './constants'

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')

  const nav = user?.role === 'STUDENT' ? STUDENT_TABS : TUTOR_TABS

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col bg-surface-1 transition-[width] duration-300 lg:flex',
        'border-r border-[var(--border-subtle)]',
        collapsed ? 'lg:w-[76px]' : 'lg:w-64',
      )}
    >
      {/* Бренд + переключатель */}
      <div className="flex h-16 items-center gap-2.5 px-3">
        {!collapsed && (
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1 py-1">
            <BrandLogo className="h-9 w-9 shrink-0 rounded-md shadow-elevation-1" />
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight text-foreground">
                Lessonify
              </h1>
              <p className="truncate text-[11px] leading-tight text-muted-foreground">
                {user?.role === 'TUTOR' ? tCommon('roleTutor') : tCommon('roleStudent')}
              </p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? tCommon('expandMenu') : tCommon('collapseMenu')}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors',
            'hover:bg-surface-2 hover:text-foreground',
            collapsed && 'mx-auto',
          )}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="mx-3 h-px bg-[var(--border-subtle)]" />

      {/* Навигация */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(({ href, labelKey, icon: Icon }) => {
          const label = tNav(labelKey)
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'brand-gradient text-primary-foreground shadow-[0_4px_14px_-4px_rgba(108,99,255,0.5)]'
                  : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
              )}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.9}
                className="shrink-0"
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Профиль + выход */}
      <div className="space-y-2 p-3">
        <div className="mx-0 h-px bg-[var(--border-subtle)]" />
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5">
              <div className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-elevation-1">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-[hsl(var(--danger)/0.12)] hover:text-[hsl(var(--danger))]"
            >
              <LogOut size={18} />
              <span>{tCommon('logout')}</span>
            </button>
          </>
        ) : (
          <>
            <div
              title={user?.name ?? undefined}
              className="brand-gradient mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-elevation-1"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => logout()}
              title={tCommon('logout')}
              className="flex w-full items-center justify-center rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-[hsl(var(--danger)/0.12)] hover:text-[hsl(var(--danger))]"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
