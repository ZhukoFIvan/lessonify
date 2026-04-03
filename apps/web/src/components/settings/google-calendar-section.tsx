'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, ExternalLink, Unlink, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendarSyncStatus, useCalendarSync } from '@/hooks/use-calendar-sync'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function GoogleCalendarSection() {
  const { status, loading, refetch } = useCalendarSyncStatus()
  const { loading: actionLoading, connectCalendar, disconnectCalendar, toggleSync, syncAll } = useCalendarSync()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('calendarConnected') === '1') {
      toast({ variant: 'success', title: 'Google Календарь подключён' })
      refetch()
    }
    if (searchParams.get('calendarError') === '1') {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось подключить Google Календарь' })
    }
  }, [searchParams, refetch])

  async function handleToggle() {
    try {
      const enabled = await toggleSync()
      toast({ variant: 'success', title: enabled ? 'Синхронизация включена' : 'Синхронизация выключена' })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка' })
    }
  }

  async function handleSyncAll() {
    try {
      const count = await syncAll()
      toast({ variant: 'success', title: `Синхронизировано ${count} уроков` })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка синхронизации' })
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectCalendar()
      toast({ variant: 'success', title: 'Google Календарь отключён' })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка' })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[#4285F4]/10 flex items-center justify-center shrink-0">
          <CalendarDays size={22} className="text-[#4285F4]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-base font-semibold text-foreground">Google Календарь</p>
            {!loading && status?.connected && (
              <Badge variant="success" className="text-[10px]">Подключён</Badge>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-4 w-40 mt-1" />
          ) : status?.connected ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Уроки автоматически синхронизируются в Google Календарь
              </p>
              {status.lastSyncAt && (
                <p className="text-[11px] text-muted-foreground">
                  Последняя синхр.: {format(new Date(status.lastSyncAt), 'd MMM HH:mm', { locale: ru })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Синхронизируйте уроки с Google Календарём автоматически
            </p>
          )}

          {loading ? (
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          ) : status?.connected ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {/* Тогл синхронизации */}
              <button
                onClick={handleToggle}
                disabled={actionLoading}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {status.syncEnabled
                  ? <ToggleRight size={20} className="text-primary" />
                  : <ToggleLeft size={20} />}
                {status.syncEnabled ? 'Синхр. вкл.' : 'Синхр. выкл.'}
              </button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleSyncAll}
                disabled={actionLoading}
              >
                <RefreshCw size={13} />
                Синхронизировать все
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/5"
                onClick={handleDisconnect}
                disabled={actionLoading}
              >
                <Unlink size={13} />
                Отключить
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <Button
                size="sm"
                className="gap-1.5 bg-[#4285F4] hover:bg-[#3367D6]"
                onClick={connectCalendar}
                disabled={actionLoading}
              >
                <ExternalLink size={13} />
                {actionLoading ? 'Загрузка...' : 'Подключить'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
