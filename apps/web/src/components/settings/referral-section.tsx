'use client'

import { useState } from 'react'
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
  const [cardDetails, setCardDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (cardDetails.trim().length < 5) return
    setLoading(true)
    try {
      await onConfirm(cardDetails.trim())
      toast({ variant: 'success', title: 'Заявка отправлена', description: 'Мы переведём средства в течение 3 рабочих дней' })
      onClose()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Попробуйте позже' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="font-bold text-foreground text-lg mb-1">Вывод средств</h3>
        <p className="text-muted-foreground text-sm mb-5">
          Сумма к выводу: <span className="font-bold text-foreground">{balance.toLocaleString('ru')} ₽</span>
        </p>

        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Реквизиты для перевода
        </label>
        <input
          type="text"
          placeholder="Номер карты или телефон СБП"
          value={cardDetails}
          onChange={e => setCardDetails(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors mb-5"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || cardDetails.trim().length < 5}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReferralSection() {
  const { stats, loading, requestWithdrawal } = useReferral()
  const [copied, setCopied] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const copyCode = () => {
    if (!stats?.referralCode) return
    navigator.clipboard.writeText(stats.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Скопировано!' })
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 animate-pulse">
        <div className="h-4 w-32 bg-secondary rounded mb-3" />
        <div className="h-12 bg-secondary rounded-xl" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Gift size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Реферальная программа</p>
            <p className="text-xs text-muted-foreground mt-0.5">Приглашайте коллег и зарабатывайте</p>
          </div>
        </div>

        {/* Referral code */}
        <div className="rounded-xl bg-secondary/50 border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2">Ваш реферальный код</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xl font-black tracking-widest text-primary">
              {stats.referralCode}
            </span>
            <button
              onClick={copyCode}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                copied
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-primary/10 text-primary hover:bg-primary/20',
              )}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-secondary/40 p-3 text-center">
            <Users size={16} className="text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-black text-foreground">{stats.referralsCount}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Приглашённых</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-3 text-center">
            <Wallet size={16} className="text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-black text-foreground">{stats.totalEarned.toLocaleString('ru')}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Заработано ₽</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-3 text-center">
            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <p className="text-lg font-black text-foreground">{stats.balance.toLocaleString('ru')}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Баланс ₽</p>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">20% с каждой покупки Pro</span> от приглашённого репетитора.
            Минимальная сумма вывода — 500 ₽.
          </p>
        </div>

        {/* Withdraw button */}
        {stats.hasPendingRequest ? (
          <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock size={15} className="text-amber-600 shrink-0" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Заявка на вывод обрабатывается
            </p>
          </div>
        ) : (
          <button
            onClick={() => setWithdrawOpen(true)}
            disabled={stats.balance < 500}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {stats.balance < 500
              ? `Вывод от 500 ₽ (сейчас ${stats.balance.toLocaleString('ru')} ₽)`
              : `Вывести ${stats.balance.toLocaleString('ru')} ₽`}
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
