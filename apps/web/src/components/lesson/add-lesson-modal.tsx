'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStudents } from '@/hooks/use-students'
import { useCreateLesson } from '@/hooks/use-lessons'
import { toast } from '@/components/ui/use-toast'

type FormData = {
  studentId: string
  subject: string
  date: string
  time: string
  durationMinutes: number
  price: number
}

const DURATIONS = [30, 45, 60, 90, 120]

interface AddLessonModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  defaultDate?: Date
}

export function AddLessonModal({ open, onClose, onCreated, defaultDate }: AddLessonModalProps) {
  const t = useTranslations('lesson')
  const { students } = useStudents()
  const { createLesson, loading } = useCreateLesson()

  const schema = z
    .object({
      studentId: z.string().min(1, t('errors.studentRequired')),
      subject: z.string().min(1, t('errors.subjectRequired')),
      date: z.string().min(1, t('errors.dateRequired')),
      time: z.string().min(1, t('errors.timeRequired')),
      durationMinutes: z.coerce.number().int().positive(),
      price: z.coerce.number().int().nonnegative(),
    })
    .refine(
      (data) => {
        const startTime = new Date(`${data.date}T${data.time}`)
        const now = new Date()
        return startTime > now
      },
      { message: t('errors.pastLesson'), path: ['date'] },
    )

  // Форматируем в локальной таймзоне чтобы не было сдвига на -1 день
  function toLocalDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const defaultDateStr = defaultDate ? toLocalDateStr(defaultDate) : toLocalDateStr(new Date())

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
      toast({ variant: 'success', title: t('toast.created') })
      reset()
      onClose()
      onCreated?.()
    } catch (err: any) {
      const message = err?.response?.data?.error || t('toast.createFailed')
      toast({ variant: 'destructive', title: t('toast.error'), description: message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Ученик */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('fields.student')}</Label>
            <Controller
              control={control}
              name="studentId"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.student')} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}{s.subject ? ` · ${s.subject}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
          </div>

          {/* Предмет */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('fields.subject')}</Label>
            <Input placeholder={t('placeholders.subject')} {...register('subject')} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          {/* Дата + Время */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 min-w-0 overflow-hidden">
              <Label>{t('fields.date')}</Label>
              <Input
                type="date"
                className="w-full max-w-full overflow-hidden"
                min={new Date().toISOString().split('T')[0]}
                {...register('date')}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5 min-w-0 overflow-hidden">
              <Label>{t('fields.time')}</Label>
              <Input type="time" className="w-full max-w-full overflow-hidden" {...register('time')} />
            </div>
          </div>

          {/* Длительность */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('fields.duration')}</Label>
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
                      {d < 60 ? t('durationMin', { m: d }) : t('durationHour', { h: d / 60 })}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Цена */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('fields.price')}</Label>
            <Input
              type="number"
              placeholder={defaultPrice > 0 ? t('placeholders.priceFromProfile', { price: defaultPrice }) : '2000'}
              {...register('price')}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? t('creating') : t('submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
