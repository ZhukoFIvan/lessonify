'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check, Gift, Users, Wallet, Clock } from 'lucide-react'
import { useReferral } from '@/hooks/use-referral'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// ── Withdraw modal ─────────────────────────────────────────────────────────────

function WithdrawModal({
  balance,
  onClose,
  onConfirm,
}: {
  balance: number
  onClose: () => void
  onConfirm: (cardDetails: string) => Promise<void>
}) {
  const t = useTranslations('settingsSections')
  const [cardDetails, setCardDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (cardDetails.trim().length < 5) return
    setLoading(true)
    try {
      await onConfirm(cardDetails.trim())
      toast({ variant: 'success', title: t('withdrawSubmitted'), description: t('withdrawSubmittedDesc') })
      onClose()
    } catch {
      toast({ variant: 'destructive', title: t('error'), description: t('tryLater') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="surface-3 rounded-lg p-6 w-full max-w-sm">
        <h3 className="font-bold text-foreground text-lg mb-1">{t('withdrawTitle')}</h3>
        <p className="text-muted-foreground text-sm mb-5">
          {t('withdrawAmount')}: <span className="tnum font-bold text-foreground">{balance.toLocaleString('ru')} ₽</span>
        </p>

        <label className="text-xs font-medium text-muted-foreground block mb-2">
          {t('withdrawDetailsLabel')}
        </label>
        <input
          type="text"
          placeholder={t('withdrawDetailsPlaceholder')}
          value={cardDetails}
          onChange={e => setCardDetails(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-surface-0 border border-subtle text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow] mb-5"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-md border border-strong text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || cardDetails.trim().length < 5}
            className="flex-1 py-2.5 rounded-md brand-gradient text-primary-foreground text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? t('sending') : t('submitRequest')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReferralSection() {
  const t = useTranslations('settingsSections')
  const { stats, loading, requestWithdrawal } = useReferral()
  const [copied, setCopied] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const copyCode = () => {
    if (!stats?.referralCode) return
    navigator.clipboard.writeText(stats.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: t('copied') })
  }

  if (loading) {
    return (
      <div className="surface-1 rounded-lg p-5 animate-pulse">
        <div className="h-4 w-32 bg-surface-2 rounded mb-3" />
        <div className="h-12 bg-surface-2 rounded-md" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <>
      <div className="surface-1 rounded-lg p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/12 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('referralTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('referralSubtitle')}</p>
          </div>
        </div>

        {/* Referral code */}
        <div className="rounded-md bg-surface-0 border border-subtle p-3">
          <p className="text-xs text-muted-foreground mb-2">{t('yourReferralCode')}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="tnum text-xl font-black tracking-widest text-primary">
              {stats.referralCode}
            </span>
            <button
              onClick={copyCode}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                copied
                  ? 'bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]'
                  : 'bg-primary/12 text-primary hover:bg-primary/20',
              )}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? t('copiedShort') : t('copy')}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-md bg-surface-0 border border-subtle p-3 text-center">
            <Users size={16} className="text-muted-foreground mx-auto mb-1" />
            <p className="tnum text-lg font-black text-foreground">{stats.referralsCount}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{t('invited')}</p>
          </div>
          <div className="rounded-md bg-surface-0 border border-subtle p-3 text-center">
            <Wallet size={16} className="text-muted-foreground mx-auto mb-1" />
            <p className="tnum text-lg font-black text-foreground">{stats.totalEarned.toLocaleString('ru')}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{t('earnedRub')}</p>
          </div>
          <div className="rounded-md bg-surface-0 border border-subtle p-3 text-center">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--success)/0.2)] flex items-center justify-center mx-auto mb-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" />
            </div>
            <p className="tnum text-lg font-black text-foreground">{stats.balance.toLocaleString('ru')}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{t('balanceRub')}</p>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-md brand-wash border border-primary/15 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.rich('referralDescription', {
              b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
            })}
          </p>
        </div>

        {/* Withdraw button */}
        {stats.hasPendingRequest ? (
          <div className="flex items-center gap-2 py-2.5 px-4 rounded-md bg-amber-500/10 border border-amber-500/20">
            <Clock size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {t('withdrawProcessing')}
            </p>
          </div>
        ) : (
          <button
            onClick={() => setWithdrawOpen(true)}
            disabled={stats.balance < 500}
            className="w-full py-2.5 rounded-md brand-gradient text-primary-foreground text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            {stats.balance < 500
              ? t('withdrawMin', { amount: stats.balance.toLocaleString('ru') })
              : t('withdrawNow', { amount: stats.balance.toLocaleString('ru') })}
          </button>
        )}
      </div>

      {withdrawOpen && (
        <WithdrawModal
          balance={stats.balance}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={requestWithdrawal}
        />
      )}
    </>
  )
}
