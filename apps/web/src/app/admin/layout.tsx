'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ArrowDownToLine, LogOut, Shield, Tag } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/withdrawals', label: 'Выводы средств', icon: ArrowDownToLine },
  { href: '/admin/promo', label: 'Промокоды', icon: Tag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [user, router])

  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="flex min-h-screen bg-[#07060f] text-white">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 min-h-screen bg-[#0d0c1d] border-r border-white/[0.06] flex flex-col fixed top-0 left-0 bottom-0">

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Shield size={17} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Admin Panel</p>
            <p className="text-white/35 text-[11px]">Lessonify</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-white/45 hover:text-white hover:bg-white/[0.05]',
                )}
              >
                <Icon size={17} className="shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-white/[0.06] space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-white/35 text-[11px] truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/45 hover:text-red-400 hover:bg-red-500/[0.07] transition-all"
          >
            <LogOut size={17} />
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 ml-56 min-h-screen overflow-auto">
        {children}
      </div>
    </div>
  )
}
