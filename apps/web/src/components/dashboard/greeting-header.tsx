'use client'

import { useMemo } from 'react'
import Link from 'next/link'
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

  return (
    <div className="flex items-center gap-4">
      <Link href="/settings">
        <Avatar className="w-12 h-12 ring-2 ring-primary/20">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name} />
          <AvatarFallback className="text-sm">
            {getInitials(user?.name ?? '?')}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div>
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-xl font-bold text-foreground tracking-tight mt-0.5">
          {greeting}, {firstName}
        </h1>
      </div>
    </div>
  )
}
