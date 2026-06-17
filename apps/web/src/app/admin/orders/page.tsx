'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react'
import { useAdminOrders, type AdminOrder } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('admin')
  const map: Record<string, string> = {
    PAID: 'bg-green-500/15 text-green-400',
    PENDING: 'bg-amber-500/15 text-amber-400',
    FAILED: 'bg-red-500/15 text-red-400',
  }
  const label: Record<string, string> = { PAID: t('orderStatus.paid'), PENDING: t('orderStatus.pending'), FAILED: t('orderStatus.failed') }
  return (
    <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full', map[status] ?? 'bg-gray-500/15 text-gray-400')}>
      {label[status] ?? status}
    </span>
  )
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl p-5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', color)}>{icon}</div>
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-xs font-medium text-white/45 uppercase tracking-wider">{label}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const t = useTranslations('admin')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, loading } = useAdminOrders(status, page)

  const STATUS_TABS = [
    { value: 'ALL', label: t('orders.tabs.all') },
    { value: 'PAID', label: t('orders.tabs.paid') },
    { value: 'PENDING', label: t('orders.tabs.pending') },
    { value: 'FAILED', label: t('orders.tabs.failed') },
  ]

  const PLAN_LABEL: Record<string, string> = { monthly: t('orders.plan.monthly'), yearly: t('orders.plan.yearly') }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">{t('orders.title')}</h1>
        <p className="text-white/40 text-sm mt-1">
          {data ? t('orders.subtitle', { count: data.total }) : '—'}
        </p>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label={t('orders.summary.revenue')}
            value={`${Number(data.summary.revenueTotal).toLocaleString('ru')} ₽`}
            icon={<DollarSign size={18} className="text-green-400" />}
            color="bg-green-500/15"
          />
          <SummaryCard label={t('orders.summary.paid')} value={data.summary.paidCount} icon={<CheckCircle size={18} className="text-emerald-400" />} color="bg-emerald-500/15" />
          <SummaryCard label={t('orders.summary.pending')} value={data.summary.pendingCount} icon={<Clock size={18} className="text-amber-400" />} color="bg-amber-500/15" />
          <SummaryCard label={t('orders.summary.failed')} value={data.summary.failedCount} icon={<XCircle size={18} className="text-red-400" />} color="bg-red-500/15" />
        </div>
      )}

      {/* Status tabs */}
      <div className="flex bg-[#0d0c1d] border border-white/[0.06] rounded-xl p-1 gap-0.5 w-fit mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1) }}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              status === tab.value ? 'bg-primary/20 text-primary' : 'text-white/40 hover:text-white/70',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-semibold text-white/35 uppercase tracking-wider">
          <span>{t('orders.table.user')}</span>
          <span>{t('orders.table.plan')}</span>
          <span>{t('orders.table.amount')}</span>
          <span>{t('orders.table.status')}</span>
          <span>{t('orders.table.date')}</span>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data?.items.map((o: AdminOrder) => (
              <div
                key={o.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {o.user.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{o.user.name}</p>
                    <p className="text-white/35 text-xs truncate">{o.user.email}</p>
                  </div>
                </div>

                {/* Plan */}
                <span className="text-white/60 text-sm">{PLAN_LABEL[o.plan] ?? o.plan}</span>

                {/* Amount */}
                <span className="text-white font-bold text-sm">{Number(o.amount).toLocaleString('ru')} ₽</span>

                {/* Status */}
                <StatusBadge status={o.status} />

                {/* Date */}
                <span className="text-white/35 text-xs">
                  {new Date(o.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
              </div>
            ))}

            {data?.items.length === 0 && (
              <p className="text-white/30 text-sm text-center py-10">{t('orders.empty')}</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-white/35 text-sm">{t('pagination', { page: data.page, pages: data.pages })}</p>
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
    </div>
  )
}
