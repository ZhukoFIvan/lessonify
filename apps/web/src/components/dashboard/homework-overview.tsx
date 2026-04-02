'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import api from '@/lib/api'

interface HwStats {
  assigned: number
  submitted: number
  overdue: number
}

export function HomeworkOverview() {
  const [stats, setStats] = useState<HwStats>({ assigned: 0, submitted: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/homework/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-full min-h-[7rem] rounded-2xl" />

  const total = stats.assigned + stats.submitted + stats.overdue

  const items = [
    { label: 'Задано', value: stats.assigned, icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Сдано', value: stats.submitted, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Просрочено', value: stats.overdue, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <Link
      href="/homework"
      className="block h-full p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Домашние задания</h3>
        </div>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">Всего: {total}</span>
        )}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground gap-2">
          <BookOpen size={24} />
          <span className="text-xs">Заданий пока нет</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((it) => {
            const Icon = it.icon
            return (
              <div key={it.label} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-background/50">
                <div className={`w-8 h-8 rounded-lg ${it.bg} flex items-center justify-center`}>
                  <Icon size={16} className={it.color} />
                </div>
                <span className="text-lg font-bold text-foreground">{it.value}</span>
                <span className="text-[10px] text-muted-foreground">{it.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </Link>
  )
}
