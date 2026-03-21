'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStudents } from '@/hooks/use-students'
import { useCreateLesson } from '@/hooks/use-lessons'
import { toast } from '@/components/ui/use-toast'

const schema = z
  .object({
    studentId: z.string().min(1, 'Выберите ученика'),
    subject: z.string().min(1, 'Укажите предмет'),
    date: z.string().min(1, 'Укажите дату'),
    time: z.string().min(1, 'Укажите время'),
    durationMinutes: z.coerce.number().int().positive(),
    price: z.coerce.number().int().nonnegative(),
  })
  .refine(
    (data) => {
      const startTime = new Date(`${data.date}T${data.time}`)
      const now = new Date()
      return startTime > now
    },
    { message: 'Нельзя создать урок в прошлом', path: ['date'] },
  )

type FormData = z.infer<typeof schema>

const DURATIONS = [30, 45, 60, 90, 120]

interface AddLessonModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  defaultDate?: Date
}

export function AddLessonModal({ open, onClose, onCreated, defaultDate }: AddLessonModalProps) {
  const { students } = useStudents()
  const { createLesson, loading } = useCreateLesson()

  const defaultDateStr = defaultDate
    ? defaultDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      durationMinutes: 60,
      date: defaultDateStr,
      time: '10:00',
      price: 0,
    },
  })

  const selectedStudentId = watch('studentId')
  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  // Автозаполнение цены из профиля ученика
  const defaultPrice = selectedStudent?.hourlyRate ?? 0

  async function onSubmit(data: FormData) {
    try {
      const startTime = new Date(`${data.date}T${data.time}`).toISOString()
      await createLesson({
        studentId: data.studentId,
        subject: data.subject,
        startTime,
        durationMinutes: data.durationMinutes,
        price: data.price || defaultPrice,
      })
      toast({ variant: 'success', title: 'Урок добавлен' })
      reset()
      onClose()
      onCreated?.()
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Не удалось создать урок'
      toast({ variant: 'destructive', title: 'Ошибка', description: message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый урок</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Ученик */}
          <div className="flex flex-col gap-1.5">
            <Label>Ученик</Label>
            <select
              {...register('studentId')}
              className="h-12 w-full rounded-2xl border border-input bg-secondary/50 px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-secondary"
            >
              <option value="">Выберите ученика...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} {s.subject ? `· ${s.subject}` : ''}</option>
              ))}
            </select>
            {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
          </div>

          {/* Предмет */}
          <div className="flex flex-col gap-1.5">
            <Label>Предмет</Label>
            <Input placeholder="Математика" {...register('subject')} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          {/* Дата + Время */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Дата</Label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('date')}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Время</Label>
              <Input type="time" {...register('time')} />
            </div>
          </div>

          {/* Длительность */}
          <div className="flex flex-col gap-1.5">
            <Label>Длительность</Label>
            <Controller
              control={control}
              name="durationMinutes"
              render={({ field }) => (
                <div className="flex gap-2 flex-wrap">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => field.onChange(d)}
                      className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                        field.value === d
                          ? 'bg-primary text-white border-primary'
                          : 'bg-secondary text-foreground border-border'
                      }`}
                    >
                      {d < 60 ? `${d}м` : `${d / 60}ч`}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Цена */}
          <div className="flex flex-col gap-1.5">
            <Label>Стоимость, ₽</Label>
            <Input
              type="number"
              placeholder={defaultPrice > 0 ? `${defaultPrice} (из профиля)` : '2000'}
              {...register('price')}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Создание...' : 'Добавить урок'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
