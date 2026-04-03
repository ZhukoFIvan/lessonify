'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Crown, Zap } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth.store'
import { getInitials } from '@tutorflow/utils'
import { formatDate } from '@tutorflow/utils'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function GreetingHeader() {
  const { user } = useAuthStore()
  const greeting = useMemo(getGreeting, [])
  const today = useMemo(() => formatDate(new Date().toISOString()), [])

  const firstName = user?.name?.split(' ')[0] ?? ''
  const isPro = user?.plan === 'PRO'

  return (
    <div className="flex items-center gap-4">
      <Link href="/settings" className="relative">
        <Avatar className="w-12 h-12 ring-2 ring-primary/20">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name} />
          <AvatarFallback className="text-sm">
            {getInitials(user?.name ?? '?')}
          </AvatarFallback>
        </Avatar>
        {isPro && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-background">
            <Crown size={10} className="text-white" />
          </span>
        )}
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">{today}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {greeting}, {firstName}
          </h1>
          <Link
            href="/settings"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
              isPro
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 hover:from-amber-500/30 hover:to-orange-500/30'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {isPro ? <Crown size={10} /> : <Zap size={10} />}
            {isPro ? 'PRO' : 'FREE'}
          </Link>
        </div>
      </div>
    </div>
  )
}
