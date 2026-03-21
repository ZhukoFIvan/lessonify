'use client'

import { Crown, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'

export function TrialBanner() {
  const user = useAuthStore((s) => s.user)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !user || user.plan !== 'PRO' || !user.planExpiresAt) return null

  const daysLeft = Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000)

  // Показываем только если осталось <= 7 дней (триал заканчивается)
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
          ? 'Pro-план истёк. Продлите чтобы не потерять функции.'
          : `Pro-план заканчивается через ${daysLeft} дн.`}
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
