'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { CalendarDays, ExternalLink, Unlink, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendarSyncStatus, useCalendarSync } from '@/hooks/use-calendar-sync'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { useFormatters } from '@/i18n/use-formatters'

export function GoogleCalendarSection() {
  const t = useTranslations('settingsSections')
  const f = useFormatters()
  const { status, loading, refetch } = useCalendarSyncStatus()
  const { loading: actionLoading, connectCalendar, disconnectCalendar, toggleSync, syncAll } = useCalendarSync()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('calendarConnected') === '1') {
      toast({ variant: 'success', title: t('calendarConnected') })
      refetch()
    }
    if (searchParams.get('calendarError') === '1') {
      toast({ variant: 'destructive', title: t('error'), description: t('calendarConnectFailed') })
    }
  }, [searchParams, refetch])

  async function handleToggle() {
    try {
      const enabled = await toggleSync()
      toast({ variant: 'success', title: enabled ? t('syncEnabled') : t('syncDisabled') })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('error') })
    }
  }

  async function handleSyncAll() {
    try {
      const count = await syncAll()
      toast({ variant: 'success', title: t('syncedLessons', { count }) })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('syncError') })
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectCalendar()
      toast({ variant: 'success', title: t('calendarDisconnected') })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('error') })
    }
  }

  return (
    <div className="surface-1 rounded-lg p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-[#4285F4]/12 flex items-center justify-center shrink-0">
          <CalendarDays size={20} className="text-[#4285F4]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground">{t('googleCalendar')}</p>
            {!loading && status?.connected && (
              <Badge variant="success" className="text-[10px]">{t('connected')}</Badge>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-4 w-40 mt-1" />
          ) : status?.connected ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {t('calendarSyncInfo')}
              </p>
              {status.lastSyncAt && (
                <p className="text-[11px] text-muted-foreground">
                  {t('lastSync')}: {format(new Date(status.lastSyncAt), 'd MMM HH:mm', { locale: f.dateFnsLocale })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('calendarSyncPrompt')}
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
                {status.syncEnabled ? t('syncOn') : t('syncOff')}
              </button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleSyncAll}
                disabled={actionLoading}
              >
                <RefreshCw size={13} />
                {t('syncAll')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/5"
                onClick={handleDisconnect}
                disabled={actionLoading}
              >
                <Unlink size={13} />
                {t('disconnect')}
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
                {actionLoading ? t('loading') : t('connect')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
