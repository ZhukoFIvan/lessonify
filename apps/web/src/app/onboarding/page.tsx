'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { AvatarPicker } from '@/components/onboarding/avatar-picker'
import { GenderPicker } from '@/components/onboarding/gender-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'
import { Sparkles } from 'lucide-react'

type Gender = 'MALE' | 'FEMALE' | 'OTHER'

// Дефолтная аватарка из DiceBear
function defaultAvatar(name: string) {
  return `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4&radius=50`
}

export default function OnboardingPage() {
  const { user } = useAuthStore()
  const { finishOnboarding } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [gender, setGender] = useState<Gender | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatar(user?.name ?? 'User'))
  const [loading, setLoading] = useState(false)

  const isValid = name.trim().length >= 2 && gender !== null && avatarUrl !== ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)
    try {
      await finishOnboarding({ name: name.trim(), gender: gender!, avatarUrl })
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Попробуйте ещё раз' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Карточка */}
      <div className="w-full max-w-2xl bg-card rounded-3xl shadow-xl border border-border p-8">
        {/* Шапка */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-md">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Расскажите о себе</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Это займёт меньше минуты
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Имя */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Ваше имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                // Обновляем дефолтный аватар при смене имени
                if (avatarUrl.includes('api.dicebear.com')) {
                  setAvatarUrl(defaultAvatar(e.target.value))
                }
              }}
              placeholder="Иван Иванко"
              autoFocus
            />
          </div>

          {/* Пол */}
          <GenderPicker value={gender} onChange={setGender} />

          {/* Аватарка */}
          <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} userName={name} />

          {/* Кнопка */}
          <div className="mt-2">
            {/* Индикатор заполненности */}
            <div className="flex gap-1.5 justify-center mb-6">
              {[name.trim().length >= 2, gender !== null, avatarUrl !== ''].map((done, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${done ? 'bg-primary' : 'bg-border'}`}
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={!isValid || loading} size="lg">
              {loading ? 'Сохранение...' : 'Начать работу →'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
