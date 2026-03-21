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

const PRESET_COLORS = [
  '#6C63FF', '#10B981', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6',
]

const schema = z.object({
  name: z.string().min(1, 'Введите имя'),
  subject: z.string().optional(),
  hourlyRate: z.coerce.number().int().nonnegative().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  color: z.string().min(1),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddStudentModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function AddStudentModal({ open, onClose, onCreated }: AddStudentModalProps) {
  const { createStudent, loading } = useCreateStudent()

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
      toast({ variant: 'success', title: 'Ученик добавлен' })
      reset({ color: PRESET_COLORS[0] })
      onClose()
      onCreated?.()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить ученика' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый ученик</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <Label>Имя *</Label>
            <Input placeholder="Иван Иванов" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Предмет */}
          <div className="flex flex-col gap-1.5">
            <Label>Предмет</Label>
            <Input placeholder="Математика" {...register('subject')} />
          </div>

          {/* Стоимость */}
          <div className="flex flex-col gap-1.5">
            <Label>Стоимость урока, ₽</Label>
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
            <Label>Телефон</Label>
            <Input placeholder="+7 999 000-00-00" {...register('phone')} />
          </div>

          {/* Цвет */}
          <div className="flex flex-col gap-2">
            <Label>Цвет</Label>
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
            <Label>Заметки</Label>
            <Input placeholder="Любая дополнительная информация" {...register('notes')} />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Сохранение...' : 'Добавить ученика'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
