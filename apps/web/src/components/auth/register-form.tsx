'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
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

type RegisterFormData = {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'TUTOR' | 'STUDENT'
  inviteToken?: string
}

interface RegisterFormProps {
  inviteToken?: string
}

export function RegisterForm({ inviteToken }: RegisterFormProps) {
  const t = useTranslations('auth')
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const registerSchema = z
    .object({
      name: z.string().min(2, t('register.nameMin')).max(100),
      email: z.string().email(t('register.emailInvalid')),
      password: z.string().min(8, t('register.passwordMin')),
      confirmPassword: z.string().min(1, t('register.confirmRequired')),
      role: z.enum(['TUTOR', 'STUDENT']),
      inviteToken: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('register.passwordMismatch'),
      path: ['confirmPassword'],
    })

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
        title: t('register.errorTitle'),
        description: err instanceof Error ? err.message : t('register.tryAgain'),
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Заголовок */}
      <div>
        <div className="brand-gradient mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-elevation-2 lg:hidden">
          <GraduationCap size={24} />
        </div>
        <h1 className="text-h1 text-foreground">{t('register.title')}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('register.subtitle')}</p>
      </div>

      {/* Выбор роли */}
      {!inviteToken && (
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'TUTOR', label: t('register.roleTutor'), icon: GraduationCap, desc: t('register.roleTutorDesc') },
            { value: 'STUDENT', label: t('register.roleStudent'), icon: BookOpen, desc: t('register.roleStudentDesc') },
          ] as const).map(({ value, label, icon: Icon, desc }) => {
            const selected = role === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value)}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all duration-150',
                  selected
                    ? 'border-primary/50 brand-wash accent-ring'
                    : 'border-[var(--border-subtle)] bg-surface-0 hover:bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-md transition-colors',
                    selected ? 'brand-gradient text-white shadow-elevation-1' : 'bg-surface-2 text-muted-foreground',
                  )}
                >
                  <Icon size={20} />
                </span>
                <div>
                  <p className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t('register.nameLabel')}</Label>
          <Input id="name" placeholder={t('register.namePlaceholder')} autoComplete="name" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t('register.passwordLabel')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.passwordMin')}
              autoComplete="new-password"
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">{t('register.confirmLabel')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t('register.confirmLabel')}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        {/* Поле для токена приглашения (только для ученика) */}
        {role === 'STUDENT' && !inviteToken && (
          <div className="rounded-lg border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.12)] p-4">
            <p className="mb-1 text-sm font-semibold text-[hsl(var(--warning))]">{t('register.inviteNeededTitle')}</p>
            <p className="text-xs text-muted-foreground">
              {t('register.inviteNeededDesc')}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          disabled={isSubmitting || (role === 'STUDENT' && !inviteToken)}
        >
          {isSubmitting ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>

      {/* Google OAuth — только для репетиторов (студенты через invite) */}
      {role !== 'STUDENT' && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="text-xs text-muted-foreground">{t('register.or')}</span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
          <GoogleButton />
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t('register.termsPrefix')}{' '}
        <a href="/offer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          {t('register.termsLink')}
        </a>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        {t('register.haveAccount')}{' '}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          {t('register.signIn')}
        </Link>
      </p>
    </div>
  )
}
