'use client'

import { useState, useEffect } from 'react'
import { Zap, Crown, Check, Tag, Clock, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { usePromo } from '@/hooks/use-promo'
import { useBilling } from '@/hooks/use-billing'
import { toast } from '@/components/ui/use-toast'
import { useSearchParams } from 'next/navigation'

const FREE_FEATURES = [
  'До 5 учеников',
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
  'Генерация PDF-счетов',
  'Приоритетная поддержка',
]

export function TariffSection() {
  const user = useAuthStore((s) => s.user)
  const isPro = user?.plan === 'PRO'
  const canTrial = !user?.trialUsed && user?.plan === 'FREE'

  const [promoInput, setPromoInput] = useState('')
  const [showPromo, setShowPromo] = useState(false)
  const { apply, loading: promoLoading, error: promoError } = usePromo()
  const { activateTrial, checkout, refreshStatus, loading: billingLoading, error: billingError } = useBilling()

  const searchParams = useSearchParams()

  useEffect(() => {
    refreshStatus()
  }, [])

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      refreshStatus()
      toast({ variant: 'success', title: 'Оплата прошла успешно! PRO-план активирован.' })
    } else if (payment === 'cancelled') {
      toast({ variant: 'destructive', title: 'Оплата отменена' })
    }
  }, [searchParams])

  const expiresAt = user?.planExpiresAt
    ? new Date(user.planExpiresAt).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const daysLeft = user?.planExpiresAt
    ? Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000)
    : null

  const isTrialExpiringSoon = isPro && daysLeft !== null && daysLeft <= 3

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    const result = await apply(promoInput.trim())
    if (result) {
      toast({ variant: 'success', title: `Промокод применён! +${result.daysAdded} дней PRO` })
      setPromoInput('')
      setShowPromo(false)
    }
  }

  const handleTrial = async () => {
    const ok = await activateTrial()
    if (ok) {
      toast({ variant: 'success', title: 'Пробный период на 30 дней активирован!' })
    } else if (billingError) {
      toast({ variant: 'destructive', title: billingError })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPro ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
          {isPro ? <Crown size={18} className="text-amber-500" /> : <Zap size={18} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {isPro ? 'PRO план' : 'Бесплатный план'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isPro && expiresAt ? `Активен до ${expiresAt}` : isPro ? 'Активен' : 'Базовые возможности'}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPro ? 'bg-amber-500/10 text-amber-600' : 'bg-secondary text-muted-foreground'}`}>
          {isPro ? 'PRO' : 'FREE'}
        </span>
      </div>

      {/* Trial expiring soon */}
      {isTrialExpiringSoon && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {daysLeft === 0 ? 'PRO-план истекает сегодня!' : `PRO-план заканчивается через ${daysLeft} дн.`}
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

      {/* Trial CTA */}
      {canTrial && (
        <button
          onClick={handleTrial}
          disabled={billingLoading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Sparkles size={15} />
          {billingLoading ? 'Активация...' : 'Попробовать PRO бесплатно — 30 дней'}
        </button>
      )}

      {/* Payment plans */}
      {!isPro && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Тарифы PRO</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Monthly */}
            <button
              onClick={() => checkout('monthly')}
              disabled={billingLoading}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              <span className="text-lg font-bold text-foreground">499 ₽</span>
              <span className="text-[11px] text-muted-foreground">в месяц</span>
            </button>
            {/* Yearly */}
            <button
              onClick={() => checkout('yearly')}
              disabled={billingLoading}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary/50 transition-colors relative disabled:opacity-50"
            >
              <span className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">
                −33%
              </span>
              <span className="text-lg font-bold text-foreground">3 990 ₽</span>
              <span className="text-[11px] text-muted-foreground">в год</span>
            </button>
          </div>
          {billingError && <p className="text-xs text-destructive mt-1">{billingError}</p>}
          <p className="text-[11px] text-muted-foreground">
            Оплачивая, вы соглашаетесь с{' '}
            <a href="https://lessonify.ru/offer.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              публичной офертой
            </a>
          </p>
        </div>
      )}

      {/* Extend PRO */}
      {isPro && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Продлить PRO</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => checkout('monthly')}
              disabled={billingLoading}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-amber-500/50 transition-colors disabled:opacity-50"
            >
              <span className="text-lg font-bold text-foreground">499 ₽</span>
              <span className="text-[11px] text-muted-foreground">+1 месяц</span>
            </button>
            <button
              onClick={() => checkout('yearly')}
              disabled={billingLoading}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors relative disabled:opacity-50"
            >
              <span className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">
                −33%
              </span>
              <span className="text-lg font-bold text-foreground">3 990 ₽</span>
              <span className="text-[11px] text-muted-foreground">+1 год</span>
            </button>
          </div>
          {billingError && <p className="text-xs text-destructive mt-1">{billingError}</p>}
          <p className="text-[11px] text-muted-foreground">
            Оплачивая, вы соглашаетесь с{' '}
            <a href="https://lessonify.ru/offer.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              публичной офертой
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
