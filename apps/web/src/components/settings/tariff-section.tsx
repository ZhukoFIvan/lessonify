'use client'

import { useState } from 'react'
import { Zap, Crown, Check, Tag, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { usePromo } from '@/hooks/use-promo'
import { toast } from '@/components/ui/use-toast'

const FREE_FEATURES = [
  'До 10 учеников',
  'Расписание и календарь',
  'Учёт оплат',
  'Домашние задания',
  'Telegram-уведомления',
]

const PRO_FEATURES = [
  'Неограниченное число учеников',
  'Все функции бесплатного плана',
  'Страница записи для учеников',
  'Google Calendar синхронизация',
  'Реферальная программа',
  'Приоритетная поддержка',
]

export function TariffSection() {
  const user = useAuthStore((s) => s.user)
  const isPro = user?.plan === 'PRO'
  const [promoInput, setPromoInput] = useState('')
  const [showPromo, setShowPromo] = useState(false)
  const { apply, loading: promoLoading, error: promoError } = usePromo()

  const expiresAt = user?.planExpiresAt
    ? new Date(user.planExpiresAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  // Считаем дни до истечения
  const daysLeft = user?.planExpiresAt
    ? Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000)
    : null

  const isTrialExpiringSoon = isPro && daysLeft !== null && daysLeft <= 3

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    const result = await apply(promoInput.trim())
    if (result) {
      toast({ variant: 'success', title: `Промокод применён! +${result.daysAdded} дней Pro` })
      setPromoInput('')
      setShowPromo(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPro ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
          {isPro ? <Crown size={18} className="text-amber-500" /> : <Zap size={18} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {isPro ? 'Pro план' : 'Бесплатный план'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPro && expiresAt ? `Активен до ${expiresAt}` : isPro ? 'Активен' : 'Базовые возможности'}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPro ? 'bg-amber-500/10 text-amber-600' : 'bg-secondary text-muted-foreground'}`}>
          {isPro ? 'PRO' : 'FREE'}
        </span>
      </div>

      {/* Trial expiring soon banner */}
      {isTrialExpiringSoon && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {daysLeft === 0 ? 'Pro-план истекает сегодня!' : `Pro-план заканчивается через ${daysLeft} дн.`}
          </p>
        </div>
      )}

      {/* Features */}
      <div className="space-y-2">
        {(isPro ? PRO_FEATURES : FREE_FEATURES).map((f) => (
          <div key={f} className="flex items-center gap-2.5">
            <Check size={13} className={isPro ? 'text-amber-500 shrink-0' : 'text-primary shrink-0'} />
            <span className="text-xs text-muted-foreground">{f}</span>
          </div>
        ))}
      </div>

      {/* Promo code */}
      {showPromo ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Введите промокод"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
              className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {promoLoading ? '...' : 'Применить'}
            </button>
          </div>
          {promoError && <p className="text-xs text-destructive">{promoError}</p>}
          <button onClick={() => setShowPromo(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Отмена
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPromo(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Tag size={12} />
          Есть промокод?
        </button>
      )}

      {/* Upgrade CTA */}
      {!isPro && (
        <a
          href="https://t.me/lessonify_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#9C8FFF] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Crown size={15} />
          Перейти на Pro
        </a>
      )}
    </div>
  )
}
