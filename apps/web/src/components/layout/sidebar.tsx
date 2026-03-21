'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { STUDENT_TABS, TUTOR_TABS } from './constants'

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const nav = user?.role === 'STUDENT' ? STUDENT_TABS : TUTOR_TABS

  return (
    <aside
      className={cn(
        'lg:border-border lg:bg-card sticky top-0 hidden h-screen transition-all duration-300 lg:flex lg:flex-col lg:border-r',
        collapsed ? 'lg:w-20' : 'lg:w-64',
      )}
    >
      <div className="border-border border-b p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Lessonify" className="w-8 h-8 rounded-xl shrink-0" />
              <div className="min-w-0">
                <h1 className="text-foreground truncate text-base font-bold">Lessonify</h1>
                <p className="text-muted-foreground truncate text-xs">
                  {user?.role === 'TUTOR' ? 'Репетитор' : 'Ученик'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'hover:bg-secondary shrink-0 rounded-lg p-2 transition-colors',
              collapsed && 'mx-auto mt-2',
            )}
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-3 transition-all',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate font-medium">{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-border border-t p-3">
        {!collapsed ? (
          <>
            <div className="bg-secondary mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
              <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{user?.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Выйти</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => logout()}
            title="Выйти"
            className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground flex w-full items-center justify-center rounded-xl p-3 transition-colors"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </aside>
  )
}
