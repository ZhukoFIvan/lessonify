'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarPicker } from '@/components/onboarding/avatar-picker'
import { GenderPicker } from '@/components/onboarding/gender-picker'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'
import { ChevronDown, User } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').max(100),
})
type FormData = z.infer<typeof schema>

export function ProfileSection() {
  const user = useAuthStore((s) => s.user)
  const { updateProfile } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? '')
  const [gender, setGender] = useState(user?.gender ?? null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    defaultValues: { name: user?.name ?? '' },
  })

  async function onSubmit(data: FormData) {
    setSaving(true)
    try {
      await updateProfile({
        name: data.name || undefined,
        gender: gender ?? undefined,
        avatarUrl: avatar?.startsWith('data:') ? undefined : (avatar || null),
      })
      toast({ variant: 'success', title: 'Профиль обновлён' })
      setExpanded(false)
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="surface-1 rounded-lg overflow-hidden">
      {/* Заголовок секции */}
      <button
        className="group w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/12 text-primary">
          <User size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Профиль</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{user?.name}</p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 pb-5 flex flex-col gap-5 border-t border-subtle pt-5">
          {/* Аватарка */}
          <AvatarPicker value={avatar} onChange={setAvatar} userName={user?.name} />

          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <Label>Имя</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Пол */}
          <GenderPicker value={gender} onChange={setGender} />

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </form>
      )}
    </div>
  )
}
