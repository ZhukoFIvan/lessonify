'use client'

import { useState } from 'react'
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

const BEFORE_OPTIONS = [
  { value: 5, label: '5 мин' },
  { value: 10, label: '10 мин' },
  { value: 15, label: '15 мин' },
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
  { value: 120, label: '2 часа' },
]

const AFTER_OPTIONS = [
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
  { value: 120, label: '2 часа' },
  { value: 240, label: '4 часа' },
  { value: 1440, label: '1 день' },
]

export function RemindersSection() {
  const { settings, loading, refetch } = useTutorSettings()
  const { update, loading: saving } = useUpdateTutorSettings()

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
      toast({ variant: 'success', title: 'Напоминания сохранены' })
      setBefore(null)
      setAfter(null)
      setTimezone(null)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить' })
    }
  }

  return (
    <div className="surface-1 rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <Bell size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Напоминания</p>
          <p className="text-xs text-muted-foreground mt-0.5">Когда напоминать об уроках</p>
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
            <p className="text-xs text-muted-foreground mb-2">За сколько до урока</p>
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
            <p className="text-xs text-muted-foreground mb-2">Напомнить об оплате через</p>
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
            <p className="text-xs text-muted-foreground mb-2">Ваш часовой пояс</p>
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
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
