'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTutorSettings, useUpdateTutorSettings } from '@/hooks/use-tutor-settings'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { detectTimezone, timezoneOptionsWith } from '@/lib/timezones'
import { Bell } from 'lucide-react'

export function RemindersSection() {
  const t = useTranslations('settingsSections')
  const { settings, loading, refetch } = useTutorSettings()
  const { update, loading: saving } = useUpdateTutorSettings()

  const BEFORE_OPTIONS = [
    { value: 5, label: t('minutesShort', { m: 5 }) },
    { value: 10, label: t('minutesShort', { m: 10 }) },
    { value: 15, label: t('minutesShort', { m: 15 }) },
    { value: 30, label: t('minutesShort', { m: 30 }) },
    { value: 60, label: t('hoursPlural', { count: 1 }) },
    { value: 120, label: t('hoursPlural', { count: 2 }) },
  ]

  const AFTER_OPTIONS = [
    { value: 30, label: t('minutesShort', { m: 30 }) },
    { value: 60, label: t('hoursPlural', { count: 1 }) },
    { value: 120, label: t('hoursPlural', { count: 2 }) },
    { value: 240, label: t('hoursPlural', { count: 4 }) },
    { value: 1440, label: t('daysPlural', { count: 1 }) },
  ]

  const [before, setBefore] = useState<number | null>(null)
  const [after, setAfter] = useState<number | null>(null)
  const [timezone, setTimezone] = useState<string | null>(null)

  // Инициализируем из загруженных настроек (часовой пояс — из настроек или из браузера)
  const currentBefore = before ?? settings?.reminderBeforeLesson ?? 60
  const currentAfter = after ?? settings?.reminderAfterLesson ?? 120
  const currentTimezone = timezone ?? settings?.timezone ?? detectTimezone()
  const timezoneOptions = timezoneOptionsWith(currentTimezone)

  const isDirty = before !== null || after !== null || timezone !== null

  async function handleSave() {
    try {
      await update({
        ...(before !== null && { reminderBeforeLesson: before }),
        ...(after !== null && { reminderAfterLesson: after }),
        ...(timezone !== null && { timezone }),
      })
      toast({ variant: 'success', title: t('remindersSaved') })
      setBefore(null)
      setAfter(null)
      setTimezone(null)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: t('error'), description: t('saveFailed') })
    }
  }

  return (
    <div className="surface-1 rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <Bell size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{t('remindersTitle')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('remindersSubtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 rounded-2xl" />
          <Skeleton className="h-10 rounded-2xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* До урока */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t('beforeLesson')}</p>
            <div className="flex gap-2 flex-wrap">
              {BEFORE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setBefore(value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                    currentBefore === value
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_-2px_rgba(108,99,255,0.5)]'
                      : 'bg-surface-0 text-foreground border-subtle hover:bg-surface-2 hover:border-strong',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* После урока (напоминание об оплате) */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t('afterLessonPayment')}</p>
            <div className="flex gap-2 flex-wrap">
              {AFTER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setAfter(value)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                    currentAfter === value
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_-2px_rgba(108,99,255,0.5)]'
                      : 'bg-surface-0 text-foreground border-subtle hover:bg-surface-2 hover:border-strong',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Часовой пояс */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">{t('timezone')}</p>
            <Select value={currentTimezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-11 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isDirty && (
            <Button size="sm" onClick={handleSave} disabled={saving} className="self-start px-6">
              {saving ? t('saving') : t('save')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
