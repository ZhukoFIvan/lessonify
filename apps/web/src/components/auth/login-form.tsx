'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleButton } from './google-button'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data.email, data.password)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Ошибка входа',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок */}
      <div>
        <Image
          src="/logo.png"
          alt="Lessonify"
          width={48}
          height={48}
          className="mb-4 rounded-lg shadow-elevation-2 lg:hidden"
        />
        <h1 className="text-h1 text-foreground">Добро пожаловать</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Войдите в свой аккаунт Lessonify</p>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Пароль</Label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Забыли пароль?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Вход...' : 'Войти'}
        </Button>
      </form>

      {/* Разделитель */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        <span className="text-xs text-muted-foreground">или</span>
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>

      <GoogleButton />

      {/* Ссылка на регистрацию */}
      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
