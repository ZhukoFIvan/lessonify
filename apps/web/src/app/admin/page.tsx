'use client'

import { Users, GraduationCap, BookOpen, Crown, Ban, Clock, TrendingUp, DollarSign } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAdminStats, type AdminUser, type AdminWithdrawal } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  sub?: string
}

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-medium text-white/45 uppercase tracking-wider">{label}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  )
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    TUTOR: 'bg-violet-500/15 text-violet-400',
    STUDENT: 'bg-blue-500/15 text-blue-400',
    ADMIN: 'bg-amber-500/15 text-amber-400',
  }
  const label: Record<string, string> = { TUTOR: 'Репетитор', STUDENT: 'Ученик', ADMIN: 'Админ' }
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', map[role] ?? 'bg-gray-500/15 text-gray-400')}>
      {label[role] ?? role}
    </span>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-500/15 text-amber-400',
    PAID: 'bg-green-500/15 text-green-400',
    REJECTED: 'bg-red-500/15 text-red-400',
  }
  const label: Record<string, string> = { PENDING: 'Ожидает', PAID: 'Оплачен', REJECTED: 'Отклонён' }
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', map[status] ?? 'bg-gray-500/15 text-gray-400')}>
      {label[status] ?? status}
    </span>
  )
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1830] border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-primary font-bold">{payload[0].value} регистраций</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { stats, loading } = useAdminStats()

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-white/5 rounded-xl mb-8 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: 'Пользователи', value: stats.totalUsers, icon: <Users size={18} className="text-violet-400" />, color: 'bg-violet-500/15' },
    { label: 'Репетиторы', value: stats.totalTutors, icon: <GraduationCap size={18} className="text-blue-400" />, color: 'bg-blue-500/15' },
    { label: 'Ученики', value: stats.totalStudents, icon: <BookOpen size={18} className="text-cyan-400" />, color: 'bg-cyan-500/15' },
    { label: 'Pro-подписки', value: stats.proUsers, icon: <Crown size={18} className="text-amber-400" />, color: 'bg-amber-500/15' },
    { label: 'Заблокированы', value: stats.blockedUsers, icon: <Ban size={18} className="text-red-400" />, color: 'bg-red-500/15' },
    { label: 'Ожидают вывода', value: stats.pendingWithdrawals, icon: <Clock size={18} className="text-orange-400" />, color: 'bg-orange-500/15' },
    { label: 'Реферальный доход', value: `${Number(stats.totalEarnings).toLocaleString('ru')} ₽`, icon: <DollarSign size={18} className="text-green-400" />, color: 'bg-green-500/15' },
    { label: 'Конверсия FREE→PRO', value: stats.totalUsers > 0 ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)}%` : '0%', icon: <TrendingUp size={18} className="text-primary" />, color: 'bg-primary/15' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Обзор активности платформы</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold">Регистрации</h2>
            <p className="text-white/40 text-xs mt-0.5">За последние 14 дней</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.registrationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6C63FF"
              strokeWidth={2}
              fill="url(#regGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent activity: two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent users */}
        <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-white font-bold text-sm">Новые пользователи</h2>
            <a href="/admin/users" className="text-primary text-xs hover:underline">Все →</a>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {stats.recentUsers.map((u: AdminUser) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-white/35 text-xs truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RoleBadge role={u.role} />
                  {u.isBlocked && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                      Блок
                    </span>
                  )}
                </div>
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="px-5 py-6 text-white/30 text-sm text-center">Нет пользователей</p>
            )}
          </div>
        </div>

        {/* Recent withdrawals */}
        <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-white font-bold text-sm">Заявки на вывод</h2>
            <a href="/admin/withdrawals" className="text-primary text-xs hover:underline">Все →</a>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {stats.recentWithdrawals.map((w: AdminWithdrawal) => (
              <div key={w.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{w.user.name}</p>
                  <p className="text-white/35 text-xs">{w.cardDetails}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-white font-bold text-sm">{Number(w.amount).toLocaleString('ru')} ₽</span>
                  <StatusBadge status={w.status} />
                </div>
              </div>
            ))}
            {stats.recentWithdrawals.length === 0 && (
              <p className="px-5 py-6 text-white/30 text-sm text-center">Нет заявок</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
