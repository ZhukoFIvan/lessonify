'use client'

import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAvailabilitySlots } from '@/hooks/use-availability'
import { toast } from '@/components/ui/use-toast'
import type { AvailabilitySlot } from '@tutorflow/types'

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

function pad(n: number) { return String(n).padStart(2, '0') }

interface AddSlotFormProps {
  dayOfWeek: number
  onSave: (payload: { dayOfWeek: number; startHour: number; startMinute: number; durationMinutes: number }) => Promise<void>
  onCancel: () => void
}

function AddSlotForm({ dayOfWeek, onSave, onCancel }: AddSlotFormProps) {
  const [hour, setHour] = useState('10')
  const [minute, setMinute] = useState('00')
  const [duration, setDuration] = useState('60')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({ dayOfWeek, startHour: parseInt(hour), startMinute: parseInt(minute), durationMinutes: parseInt(duration) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-2 p-2.5 bg-secondary/40 rounded-xl flex flex-wrap items-center gap-2">
      <select value={hour} onChange={(e) => setHour(e.target.value)}
        className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>{pad(i)}</option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">:</span>
      <select value={minute} onChange={(e) => setMinute(e.target.value)}
        className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
        {['00', '15', '30', '45'].map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={duration} onChange={(e) => setDuration(e.target.value)}
        className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
        {[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} мин</option>)}
      </select>
      <div className="flex gap-1.5 ml-auto">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>Отмена</Button>
        <Button size="sm" className="h-7 px-3 text-xs" onClick={handleSave} disabled={saving}>Добавить</Button>
      </div>
    </div>
  )
}

export function AvailabilitySection() {
  const { slots, loading, createSlot, updateSlot, deleteSlot } = useAvailabilitySlots()
  const [addingDay, setAddingDay] = useState<number | null>(null)

  const slotsByDay = DAY_NAMES.reduce((acc, _, i) => {
    acc[i] = slots.filter((s) => s.dayOfWeek === i)
    return acc
  }, {} as Record<number, AvailabilitySlot[]>)

  // Показываем только дни Пн-Вс (1-7) в удобном порядке
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]

  async function handleCreate(payload: { dayOfWeek: number; startHour: number; startMinute: number; durationMinutes: number }) {
    try {
      await createSlot(payload)
      setAddingDay(null)
      toast({ variant: 'success', title: 'Слот добавлен' })
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить слот' })
    }
  }

  async function handleToggle(slot: AvailabilitySlot) {
    try {
      await updateSlot(slot.id, { isActive: !slot.isActive })
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка' })
    }
  }

  async function handleDelete(slotId: string) {
    try {
      await deleteSlot(slotId)
      toast({ variant: 'success', title: 'Слот удалён' })
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка' })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CalendarClock size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Расписание записи</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Укажите, когда ученики могут записаться</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {orderedDays.map((dayIdx) => (
            <div key={dayIdx}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">{DAY_NAMES_FULL[dayIdx]}</span>
                <button
                  onClick={() => setAddingDay(addingDay === dayIdx ? null : dayIdx)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus size={11} />
                  Добавить
                </button>
              </div>

              {slotsByDay[dayIdx]!.map((slot) => (
                <div key={slot.id} className={`flex items-center justify-between px-3 py-2 rounded-xl mb-1 transition-opacity ${slot.isActive ? 'bg-secondary/60' : 'bg-secondary/20 opacity-50'}`}>
                  <span className="text-sm font-medium">
                    {pad(slot.startHour)}:{pad(slot.startMinute)} · {slot.durationMinutes} мин
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(slot)}
                      className="h-10 w-10 rounded-full flex items-center justify-center transition-colors hover:bg-primary/10"
                    >
                      {slot.isActive
                        ? <ToggleRight size={28} className="text-primary" />
                        : <ToggleLeft size={28} className="text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="h-10 w-10 rounded-full flex items-center justify-center transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}

              {slotsByDay[dayIdx]!.length === 0 && addingDay !== dayIdx && (
                <p className="text-xs text-muted-foreground pl-1">Нет слотов</p>
              )}

              {addingDay === dayIdx && (
                <AddSlotForm
                  dayOfWeek={dayIdx}
                  onSave={handleCreate}
                  onCancel={() => setAddingDay(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
