'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Zap, Crown, Check, Tag, Clock, Sparkles, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { usePromo } from '@/hooks/use-promo'
import { useBilling } from '@/hooks/use-billing'
import { toast } from '@/components/ui/use-toast'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useFormatters } from '@/i18n/use-formatters'

// Карточка тарифа для оплаты/продления
function PlanOption({
  price,
  unit,
  caption,
  badge,
  highlighted,
  disabled,
  onClick,
}: {
  price: string
  unit: string
  caption: string
  badge?: string
  highlighted?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col items-start gap-1 rounded-md border p-3.5 text-left transition-all duration-200 disabled:opacity-50',
        highlighted
          ? 'brand-wash border-primary/30 hover:border-primary/50 hover:shadow-elevation-1'
          : 'bg-surface-0 border-subtle hover:bg-surface-2 hover:border-strong',
      )}
    >
      {badge && (
        <span className="absolute -top-2 right-2.5 rounded-full bg-[hsl(var(--success)/0.16)] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--success))] ring-1 ring-inset ring-[hsl(var(--success)/0.25)]">
          {badge}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        <span className="tnum text-xl font-extrabold tracking-tight text-foreground">{price}</span>
        <span className="text-sm font-semibold text-muted-foreground">{unit}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">{caption}</span>
    </button>
  )
}

export function TariffSection() {
  const t = useTranslations('settingsSections')
  const user = useAuthStore((s) => s.user)
  const isPro = user?.plan === 'PRO'
  const canTrial = !user?.trialUsed && user?.plan === 'FREE'

  const FREE_FEATURES = [
    t('freeFeatures.students'),
    t('freeFeatures.schedule'),
    t('freeFeatures.payments'),
    t('freeFeatures.homework'),
    t('freeFeatures.telegram'),
  ]

  const PRO_FEATURES = [
    t('proFeatures.unlimitedStudents'),
    t('proFeatures.allFree'),
    t('proFeatures.bookingPage'),
    t('proFeatures.googleCalendar'),
    t('proFeatures.referral'),
    t('proFeatures.pdfInvoices'),
    t('proFeatures.prioritySupport'),
  ]

  const [promoInput, setPromoInput] = useState('')
  const [showPromo, setShowPromo] = useState(false)
  const { apply, loading: promoLoading, error: promoError } = usePromo()
  const { activateTrial, checkout, refreshStatus, loading: billingLoading, error: billingError } = useBilling()

  const searchParams = useSearchParams()
  const f = useFormatters()

  useEffect(() => {
    refreshStatus()
  }, [])

  useEffect(() => {
    const payment = searchParams.get('payment')
    // Robokassa редиректит на Success/Fail URL (= /settings) и сама дописывает
    // свои параметры. Success-редирект подписан (SignatureValue + OutSum), Fail — нет.
    const robokassaSuccess = !!searchParams.get('SignatureValue') && !!searchParams.get('OutSum')
    const robokassaReturn = !!searchParams.get('InvId') || !!searchParams.get('OutSum')

    if (payment === 'success' || robokassaSuccess) {
      refreshStatus()
      toast({ variant: 'success', title: t('paymentSuccess') })
    } else if (payment === 'cancelled') {
      toast({ variant: 'destructive', title: t('paymentCancelled') })
    } else if (robokassaReturn) {
      // Вернулись с оплаты без явного успеха — просто обновим статус плана.
      refreshStatus()
    }
  }, [searchParams])

  const expiresAt = user?.planExpiresAt
    ? f.dateFull(new Date(user.planExpiresAt).toISOString())
    : null

  const daysLeft = user?.planExpiresAt
    ? Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000)
    : null

  const isTrialExpiringSoon = isPro && daysLeft !== null && daysLeft <= 3

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    const result = await apply(promoInput.trim())
    if (result) {
      toast({ variant: 'success', title: t('promoApplied', { count: result.daysAdded }) })
      setPromoInput('')
      setShowPromo(false)
    }
  }

  const handleTrial = async () => {
    const ok = await activateTrial()
    if (ok) {
      toast({ variant: 'success', title: t('trialActivated') })
    } else if (billingError) {
      toast({ variant: 'destructive', title: billingError })
    }
  }

  const features = isPro ? PRO_FEATURES : FREE_FEATURES

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg p-5 space-y-4',
        isPro
          ? 'border border-amber-500/25 bg-amber-500/[0.04] shadow-elevation-1'
          : 'surface-1',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-md',
            isPro ? 'bg-amber-500/15 text-amber-500' : 'bg-primary/12 text-primary',
          )}
        >
          {isPro ? <Crown size={20} /> : <Zap size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {isPro ? t('proPlan') : t('freePlan')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {isPro && expiresAt ? t('activeUntil', { date: expiresAt }) : isPro ? t('active') : t('basicFeatures')}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
            isPro
              ? 'bg-amber-500/12 text-amber-600 ring-amber-500/25 dark:text-amber-400'
              : 'bg-surface-2 text-muted-foreground ring-[var(--border-subtle)]',
          )}
        >
          {isPro ? 'PRO' : 'FREE'}
        </span>
      </div>

      {/* Trial expiring soon */}
      {isTrialExpiringSoon && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
          <Clock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {daysLeft === 0 ? t('proExpiresToday') : t('proExpiresIn', { count: daysLeft })}
          </p>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 gap-y-2">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                isPro ? 'bg-amber-500/15 text-amber-500' : 'bg-primary/12 text-primary',
              )}
            >
              <Check size={11} strokeWidth={3} />
            </span>
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
              placeholder={t('promoPlaceholder')}
              value={promoInput}
              onChange={e => setPromoInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
              className="flex-1 rounded-md bg-surface-0 border border-subtle px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25 transition-[border-color,box-shadow]"
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className="rounded-md brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
            >
              {promoLoading ? '...' : t('apply')}
            </button>
          </div>
          {promoError && <p className="text-xs text-destructive">{promoError}</p>}
          <button onClick={() => setShowPromo(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t('cancel')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPromo(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Tag size={12} />
          {t('havePromo')}
        </button>
      )}

      {/* Trial CTA */}
      {canTrial && (
        <button
          onClick={handleTrial}
          disabled={billingLoading}
          className="group flex w-full items-center justify-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
        >
          <Sparkles size={15} />
          {billingLoading ? t('activating') : t('tryProFree')}
          {!billingLoading && <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />}
        </button>
      )}

      {/* Payment plans */}
      {!isPro && (
        <div className="space-y-2.5 border-t border-subtle pt-4">
          <p className="text-xs font-semibold text-foreground">{t('proPlans')}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <PlanOption
              price="499"
              unit="₽"
              caption={t('perMonth')}
              onClick={() => checkout('monthly')}
              disabled={billingLoading}
            />
            <PlanOption
              price="3 990"
              unit="₽"
              caption={t('perYear')}
              badge="−33%"
              highlighted
              onClick={() => checkout('yearly')}
              disabled={billingLoading}
            />
          </div>
          {billingError && <p className="text-xs text-destructive mt-1">{billingError}</p>}
          <p className="text-[11px] text-muted-foreground">
            {t.rich('offerAgreement', {
              a: (chunks) => (
                <a href="/offer" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      )}

      {/* Extend PRO */}
      {isPro && (
        <div className="space-y-2.5 border-t border-amber-500/15 pt-4">
          <p className="text-xs font-semibold text-foreground">{t('extendPro')}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => checkout('monthly')}
              disabled={billingLoading}
              className="flex flex-col items-start gap-1 rounded-md border border-subtle bg-surface-0 p-3.5 text-left transition-all hover:border-amber-500/40 hover:bg-surface-2 disabled:opacity-50"
            >
              <div className="flex items-baseline gap-1">
                <span className="tnum text-xl font-extrabold tracking-tight text-foreground">499</span>
                <span className="text-sm font-semibold text-muted-foreground">₽</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{t('plusMonth')}</span>
            </button>
            <button
              onClick={() => checkout('yearly')}
              disabled={billingLoading}
              className="relative flex flex-col items-start gap-1 rounded-md border border-amber-500/30 bg-amber-500/[0.06] p-3.5 text-left transition-all hover:border-amber-500/50 disabled:opacity-50"
            >
              <span className="absolute -top-2 right-2.5 rounded-full bg-[hsl(var(--success)/0.16)] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--success))] ring-1 ring-inset ring-[hsl(var(--success)/0.25)]">
                −33%
              </span>
              <div className="flex items-baseline gap-1">
                <span className="tnum text-xl font-extrabold tracking-tight text-foreground">3 990</span>
                <span className="text-sm font-semibold text-muted-foreground">₽</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{t('plusYear')}</span>
            </button>
          </div>
          {billingError && <p className="text-xs text-destructive mt-1">{billingError}</p>}
          <p className="text-[11px] text-muted-foreground">
            {t.rich('offerAgreement', {
              a: (chunks) => (
                <a href="/offer" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      )}
    </div>
  )
}
