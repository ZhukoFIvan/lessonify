'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminWithdrawals, type AdminWithdrawal } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('admin')
  const map: Record<string, string> = {
    PENDING: 'bg-amber-500/15 text-amber-400',
    PAID: 'bg-green-500/15 text-green-400',
    REJECTED: 'bg-red-500/15 text-red-400',
  }
  const label: Record<string, string> = { PENDING: t('withdrawalStatus.pending'), PAID: t('withdrawalStatus.paid'), REJECTED: t('withdrawalStatus.rejected') }
  return (
    <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full', map[status] ?? 'bg-gray-500/15 text-gray-400')}>
      {label[status] ?? status}
    </span>
  )
}

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
  withdrawal,
  onClose,
  onConfirm,
}: {
  withdrawal: AdminWithdrawal
  onClose: () => void
  onConfirm: (note: string) => Promise<void>
}) {
  const t = useTranslations('admin')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm(note)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13121f] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-1">{t('rejectModal.title')}</h3>
        <p className="text-white/40 text-sm mb-5">
          {withdrawal.user.name} · {Number(withdrawal.amount).toLocaleString('ru')} ₽
        </p>

        <label className="text-white/50 text-xs font-medium block mb-2">{t('rejectModal.reasonLabel')}</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={t('rejectModal.reasonPlaceholder')}
          rows={3}
          className="w-full bg-[#1a1830] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/40 resize-none transition-colors mb-5"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 border border-white/[0.06] hover:text-white transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/80 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
          >
            {loading ? t('rejectModal.rejecting') : t('rejectModal.reject')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminWithdrawalsPage() {
  const t = useTranslations('admin')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [rejectTarget, setRejectTarget] = useState<AdminWithdrawal | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const { data, loading, processWithdrawal } = useAdminWithdrawals(status, page)

  const STATUS_TABS = [
    { value: 'ALL', label: t('withdrawals.tabs.all') },
    { value: 'PENDING', label: t('withdrawals.tabs.pending') },
    { value: 'PAID', label: t('withdrawals.tabs.paid') },
    { value: 'REJECTED', label: t('withdrawals.tabs.rejected') },
  ]

  const handlePay = async (w: AdminWithdrawal) => {
    setProcessingId(w.id)
    try {
      await processWithdrawal(w.id, 'PAID')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">{t('withdrawals.title')}</h1>
        <p className="text-white/40 text-sm mt-1">
          {data ? t('withdrawals.count', { count: data.total }) : '—'}
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex bg-[#0d0c1d] border border-white/[0.06] rounded-xl p-1 gap-0.5 w-fit mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1) }}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              status === tab.value
                ? 'bg-primary/20 text-primary'
                : 'text-white/40 hover:text-white/70',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d0c1d] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-semibold text-white/35 uppercase tracking-wider">
          <span>{t('withdrawals.table.user')}</span>
          <span>{t('withdrawals.table.amount')}</span>
          <span>{t('withdrawals.table.details')}</span>
          <span>{t('withdrawals.table.status')}</span>
          <span>{t('withdrawals.table.actions')}</span>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
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
            {data?.items.map((w: AdminWithdrawal) => (
              <div
                key={w.id}
                className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {w.user.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{w.user.name}</p>
                    <p className="text-white/35 text-xs">
                      {new Date(w.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <span className="text-white font-bold text-sm">
                  {Number(w.amount).toLocaleString('ru')} ₽
                </span>

                {/* Card details */}
                <div className="min-w-0">
                  <p className="text-white/60 text-sm truncate">{w.cardDetails}</p>
                  {w.adminNote && (
                    <p className="text-red-400/70 text-xs truncate mt-0.5">{w.adminNote}</p>
                  )}
                </div>

                {/* Status */}
                <StatusBadge status={w.status} />

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {w.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handlePay(w)}
                        disabled={processingId === w.id}
                        title={t('withdrawals.confirmPayment')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => setRejectTarget(w)}
                        title={t('rejectModal.reject')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="text-white/20 text-xs">
                      {w.processedAt ? new Date(w.processedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' }) : '—'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {data?.items.length === 0 && (
              <p className="text-white/30 text-sm text-center py-10">
                {status === 'PENDING' ? t('withdrawals.emptyPending') : t('withdrawals.empty')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-white/35 text-sm">
            {t('pagination', { page: data.page, pages: data.pages })}
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

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          withdrawal={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={async (note) => {
            await processWithdrawal(rejectTarget.id, 'REJECTED', note || undefined)
          }}
        />
      )}
    </div>
  )
}
