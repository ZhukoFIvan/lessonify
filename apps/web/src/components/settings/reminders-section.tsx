'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useTutorSettings, useUpdateTutorSettings } from '@/hooks/use-tutor-settings'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
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

  // Инициализируем из загруженных настроек
  const currentBefore = before ?? settings?.reminderBeforeLesson ?? 60
  const currentAfter = after ?? settings?.reminderAfterLesson ?? 120

  const isDirty = before !== null || after !== null

  async function handleSave() {
    try {
      await update({
        ...(before !== null && { reminderBeforeLesson: before }),
        ...(after !== null && { reminderAfterLesson: after }),
      })
      toast({ variant: 'success', title: 'Напоминания сохранены' })
      setBefore(null)
      setAfter(null)
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить' })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Напоминания</p>
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
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background text-foreground border-border',
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
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background text-foreground border-border',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
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
