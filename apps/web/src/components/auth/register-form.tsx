'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Eye, EyeOff, GraduationCap, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleButton } from './google-button'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Минимум 2 символа').max(100),
    email: z.string().email('Некорректный email'),
    password: z.string().min(8, 'Минимум 8 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    role: z.enum(['TUTOR', 'STUDENT']),
    inviteToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  inviteToken?: string
}

export function RegisterForm({ inviteToken }: RegisterFormProps) {
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: inviteToken ? 'STUDENT' : 'TUTOR',
      inviteToken: inviteToken ?? '',
    },
  })

  const role = watch('role')

  async function onSubmit(data: RegisterFormData) {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        inviteToken: data.inviteToken || undefined,
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Ошибка регистрации',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Заголовок */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <GraduationCap size={28} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Создать аккаунт</h1>
        <p className="text-muted-foreground mt-1 text-sm">Присоединяйтесь к Lessonify</p>
      </div>

      {/* Выбор роли */}
      {!inviteToken && (
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'TUTOR', label: 'Репетитор', icon: GraduationCap, desc: 'Веду уроки' },
            { value: 'STUDENT', label: 'Ученик', icon: BookOpen, desc: 'Учусь' },
          ] as const).map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('role', value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-150',
                role === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                role === value ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground',
              )}>
                <Icon size={20} />
              </div>
              <div>
                <p className={cn('font-semibold text-sm', role === value && 'text-primary')}>{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input id="name" placeholder="Иван Иванов" autoComplete="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Пароль</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Минимум 8 символов"
              autoComplete="new-password"
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Повторите пароль</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Повторите пароль"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        {/* Поле для токена приглашения (только для ученика) */}
        {role === 'STUDENT' && !inviteToken && (
          <div className="rounded-2xl bg-warning/10 border border-warning/30 p-4">
            <p className="text-sm text-warning font-medium mb-1">Нужна ссылка-приглашение</p>
            <p className="text-xs text-muted-foreground">
              Попросите репетитора отправить вам персональную ссылку для регистрации.
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isSubmitting || (role === 'STUDENT' && !inviteToken)}
        >
          {isSubmitting ? 'Создание...' : 'Создать аккаунт'}
        </Button>
      </form>

      {/* Google OAuth — только для репетиторов (студенты через invite) */}
      {role !== 'STUDENT' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">или</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <GoogleButton />
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Регистрируясь, вы соглашаетесь с{' '}
        <a href="https://lessonify.ru/offer.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          публичной офертой
        </a>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/auth/login" className="text-primary font-semibold">
          Войти
        </Link>
      </p>
    </div>
  )
}
