'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarPlus, Clock, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTutorPublicSlots, useMyBookings } from '@/hooks/use-availability'
import { toast } from '@/components/ui/use-toast'
import type { AvailabilitySlot } from '@tutorflow/types'

interface BookingSlotsViewProps {
  date: Date
  tutorId: string | null
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function BookingSlotsView({ date, tutorId }: BookingSlotsViewProps) {
  const { slots, loading } = useTutorPublicSlots(tutorId)
  const { requestBooking } = useMyBookings()
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  // Слоты для этого дня недели
  const dayOfWeek = date.getDay()
  const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek)

  useEffect(() => {
    setSelectedSlot(null)
    setNote('')
  }, [date])

  if (loading) return null
  if (daySlots.length === 0) return (
    <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
      <CalendarPlus size={28} className="opacity-40" />
      <p className="text-sm font-medium">Нет доступных слотов</p>
      <p className="text-xs text-center">Репетитор не указал время записи для этого дня</p>
    </div>
  )

  async function handleBook() {
    if (!selectedSlot) return
    const requestedAt = new Date(date)
    requestedAt.setHours(selectedSlot.startHour, selectedSlot.startMinute, 0, 0)

    setSending(true)
    try {
      await requestBooking({ slotId: selectedSlot.id, requestedAt: requestedAt.toISOString(), note: note || undefined })
      toast({ variant: 'success', title: 'Запрос отправлен', description: 'Репетитор получит уведомление' })
      setSelectedSlot(null)
      setNote('')
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Не удалось отправить запрос'
      toast({ variant: 'destructive', title: 'Ошибка', description: msg })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
        <CalendarPlus size={13} />
        Доступные слоты для записи
      </p>

      <div className="flex flex-col gap-2">
        {daySlots.map((slot) => {
          const isSelected = selectedSlot?.id === slot.id
          return (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(isSelected ? null : slot)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock size={14} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                <span className="text-sm font-medium">
                  {pad(slot.startHour)}:{pad(slot.startMinute)}
                </span>
                <span className="text-xs text-muted-foreground">· {slot.durationMinutes} мин</span>
              </div>
            </button>
          )
        })}
      </div>

      {selectedSlot && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Комментарий репетитору (необязательно)..."
            className="w-full text-xs bg-background border border-border rounded-xl p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            rows={2}
          />
          <Button className="w-full gap-2" onClick={handleBook} disabled={sending}>
            <Send size={14} />
            {sending ? 'Отправка...' : `Записаться на ${pad(selectedSlot.startHour)}:${pad(selectedSlot.startMinute)}`}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {format(date, 'd MMMM', { locale: ru })} · {selectedSlot.durationMinutes} минут
          </p>
        </div>
      )}
    </div>
  )
}
