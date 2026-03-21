'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, ShieldOff, Shield, Crown, UserMinus } from 'lucide-react'
import { useAdminUsers, type AdminUser } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

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

// ── Plan badge ────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  return plan === 'PRO'
    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">PRO</span>
    : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/8 text-white/35">FREE</span>
}

// ── Plan modal ────────────────────────────────────────────────────────────────

function PlanModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser
  onClose: () => void
  onSave: (plan: 'FREE' | 'PRO', months?: number) => Promise<void>
}) {
  const [plan, setPlan] = useState<'FREE' | 'PRO'>(user.plan)
  const [months, setMonths] = useState(1)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(plan, plan === 'PRO' ? months : undefined)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13121f] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-1">Изменить тариф</h3>
        <p className="text-white/40 text-sm mb-6">{user.name}</p>

        <div className="flex gap-3 mb-5">
          {(['FREE', 'PRO'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border',
                plan === p
                  ? p === 'PRO'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-white/10 text-white border-white/20'
                  : 'border-white/[0.06] text-white/35 hover:text-white/60',
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {plan === 'PRO' && (
          <div className="mb-5">
            <label className="text-white/50 text-xs font-medium block mb-2">Срок (месяцев)</label>
            <div className="flex gap-2 flex-wrap">
              {[1, 3, 6, 12].map(m => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border',
                    months === m
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'border-white/[0.06] text-white/35 hover:text-white/60',
                  )}
                >
                  {m} мес.
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 border border-white/[0.06] hover:text-white transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ROLE_TABS = [
  { value: 'ALL', label: 'Все' },
  { value: 'TUTOR', label: 'Репетиторы' },
  { value: 'STUDENT', label: 'Ученики' },
]

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [page, setPage] = useState(1)
  const [planModal, setPlanModal] = useState<AdminUser | null>(null)

  const { data, loading, blockUser, setPlan } = useAdminUsers(search, role, page)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Пользователи</h1>
        <p className="text-white/40 text-sm mt-1">
          {data ? `${data.total} пользователей` : '—'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Поиск по имени или email"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 bg-[#0d0c1d] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Role tabs */}
        <div className="flex bg-[#0d0c1d] border border-white/[0.06] rounded-xl p-1 gap-0.5 w-fit">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setRole(tab.value); setPage(1) }}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                role === tab.value
                  ? 'bg-primary/20 text-primary'
                  : 'text-white/40 hover:text-white/70',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-semibold text-white/35 uppercase tracking-wider">
          <span>Пользователь</span>
          <span>Email</span>
          <span>Роль</span>
          <span>Тариф</span>
          <span>Действия</span>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data?.users.map((user: AdminUser) => (
              <div
                key={user.id}
                className={cn(
                  'grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors',
                  user.isBlocked && 'opacity-50',
                )}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {user.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user.name}</p>
                    <p className="text-white/30 text-xs">
                      {new Date(user.createdAt).toLocaleDateString('ru')}
                      {user.isBlocked && <span className="text-red-400 ml-2">• заблокирован</span>}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <p className="text-white/50 text-sm truncate">{user.email}</p>

                {/* Role */}
                <RoleBadge role={user.role} />

                {/* Plan */}
                <PlanBadge plan={user.plan} />

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPlanModal(user)}
                    title="Изменить тариф"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                  >
                    <Crown size={15} />
                  </button>
                  <button
                    onClick={() => blockUser(user.id)}
                    title={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      user.isBlocked
                        ? 'text-green-400 hover:bg-green-500/10'
                        : 'text-white/35 hover:text-red-400 hover:bg-red-500/10',
                    )}
                  >
                    {user.isBlocked ? <Shield size={15} /> : <ShieldOff size={15} />}
                  </button>
                </div>
              </div>
            ))}

            {data?.users.length === 0 && (
              <p className="text-white/30 text-sm text-center py-10">Пользователи не найдены</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-white/35 text-sm">
            Страница {data.page} из {data.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="w-9 h-9 rounded-xl border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Plan modal */}
      {planModal && (
        <PlanModal
          user={planModal}
          onClose={() => setPlanModal(null)}
          onSave={async (plan, months) => {
            await setPlan(planModal.id, plan, months)
          }}
        />
      )}
    </div>
  )
}
