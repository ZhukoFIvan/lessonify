'use client'

import { Crown, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useBilling } from '@/hooks/use-billing'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'

export function TrialBanner() {
  const user = useAuthStore((s) => s.user)
  const [dismissed, setDismissed] = useState(false)
  const { activateTrial, loading } = useBilling()

  if (dismissed || !user) return null

  const isPro = user.plan === 'PRO'
  const canTrial = !user.trialUsed && user.plan === 'FREE'

  // FREE user who hasn't tried PRO yet
  if (canTrial) {
    const handleTrial = async () => {
      const ok = await activateTrial()
      if (ok) toast({ variant: 'success', title: 'PRO на 30 дней активирован!' })
    }

    return (
      <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl border bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <Sparkles size={16} className="text-amber-500 shrink-0" />
        <p className="text-xs font-medium flex-1 text-amber-700 dark:text-amber-400">
          Попробуйте PRO бесплатно — 30 дней без ограничений
        </p>
        <button
          onClick={handleTrial}
          disabled={loading}
          className="text-xs font-semibold shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Активировать'}
        </button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  // PRO user with expiring plan
  if (!isPro || !user.planExpiresAt) return null

  const daysLeft = Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000)
  if (daysLeft > 7) return null

  const isExpired = daysLeft <= 0
  const isUrgent = daysLeft <= 2

  return (
    <div className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl border ${
      isUrgent
        ? 'bg-red-500/10 border-red-500/20'
        : 'bg-amber-500/10 border-amber-500/20'
    }`}>
      <Crown size={16} className={isUrgent ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
      <p className={`text-xs font-medium flex-1 ${isUrgent ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
        {isExpired
          ? 'PRO-план истёк. Продлите чтобы не потерять функции.'
          : `PRO-план заканчивается через ${daysLeft} дн.`}
      </p>
      <Link
        href="/settings"
        className={`text-xs font-semibold shrink-0 underline ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}
      >
        Продлить
      </Link>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}
