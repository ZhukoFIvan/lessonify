'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateStudent } from '@/hooks/use-students'
import { toast } from '@/components/ui/use-toast'
import { useTranslations } from 'next-intl'

const PRESET_COLORS = [
  '#6C63FF', '#10B981', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6',
]

type FormData = {
  name: string
  subject?: string
  hourlyRate?: number
  email?: string
  phone?: string
  color: string
  notes?: string
}

interface AddStudentModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function AddStudentModal({ open, onClose, onCreated }: AddStudentModalProps) {
  const t = useTranslations('students')
  const { createStudent, loading } = useCreateStudent()

  const schema = z.object({
    name: z.string().min(1, t('form.nameRequired')),
    subject: z.string().optional(),
    hourlyRate: z.coerce.number().int().nonnegative().optional(),
    email: z.string().email(t('form.emailInvalid')).optional().or(z.literal('')),
    phone: z.string().optional(),
    color: z.string().min(1),
    notes: z.string().optional(),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: PRESET_COLORS[0] },
  })

  const selectedColor = watch('color')

  async function onSubmit(data: FormData) {
    try {
      await createStudent({
        name: data.name,
        subject: data.subject || undefined,
        hourlyRate: data.hourlyRate || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        color: data.color,
        notes: data.notes || undefined,
      })
      toast({ variant: 'success', title: t('toast.created') })
      reset({ color: PRESET_COLORS[0] })
      onClose()
      onCreated?.()
    } catch {
      toast({ variant: 'destructive', title: t('toast.error'), description: t('toast.createError') })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.name')}</Label>
            <Input placeholder={t('form.namePlaceholder')} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Предмет */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.subject')}</Label>
            <Input placeholder={t('form.subjectPlaceholder')} {...register('subject')} />
          </div>

          {/* Стоимость */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.hourlyRate')}</Label>
            <Input type="number" placeholder="2000" {...register('hourlyRate')} />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="ivan@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Телефон */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.phone')}</Label>
            <Input placeholder="+7 999 000-00-00" {...register('phone')} />
          </div>

          {/* Цвет */}
          <div className="flex flex-col gap-2">
            <Label>{t('form.color')}</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#1A1A2E' : 'transparent',
                    transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          {/* Заметки */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('form.notes')}</Label>
            <Input placeholder={t('form.notesPlaceholder')} {...register('notes')} />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? t('form.saving') : t('form.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
