'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

// ── Схемы ──────────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Некорректный email'),
})

const codeSchema = z.object({
  code: z.string().length(6, 'Код должен быть 6 цифр').regex(/^\d+$/, 'Только цифры'),
})

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Минимум 8 символов'),
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type EmailData = z.infer<typeof emailSchema>
type CodeData = z.infer<typeof codeSchema>
type PasswordData = z.infer<typeof passwordSchema>

// ── Компонент ──────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [code, setCode] = useState('')

  // ── Шаг 1: ввод email ──────────────────────────────────────────────────────

  const emailForm = useForm<EmailData>({ resolver: zodResolver(emailSchema) })

  async function onEmailSubmit(data: EmailData) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ variant: 'destructive', title: err.error ?? 'Ошибка' })
      return
    }
    setEmail(data.email)
    setStep(2)
  }

  // ── Шаг 2: ввод кода ───────────────────────────────────────────────────────

  const codeForm = useForm<CodeData>({ resolver: zodResolver(codeSchema) })

  function onCodeSubmit(data: CodeData) {
    setCode(data.code)
    setStep(3)
  }

  // ── Шаг 3: новый пароль ────────────────────────────────────────────────────

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  async function onPasswordSubmit(data: PasswordData) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword: data.newPassword }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast({ variant: 'destructive', title: err.error ?? 'Ошибка' })
      // Если код неверный — возвращаем на шаг 2
      if (res.status === 400) setStep(2)
      return
    }
    toast({ variant: 'success', title: 'Пароль изменён', description: 'Войдите с новым паролем' })
    router.push('/auth/login')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Заголовок */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
          <KeyRound size={26} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {step === 1 && 'Сброс пароля'}
          {step === 2 && 'Введите код'}
          {step === 3 && 'Новый пароль'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {step === 1 && 'Введите email — отправим код на почту'}
          {step === 2 && `Код отправлен на ${email}`}
          {step === 3 && 'Придумайте новый пароль'}
        </p>
      </div>

      {/* Индикатор шагов */}
      <div className="flex items-center gap-2 justify-center">
        {([1, 2, 3] as const).map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s <= step ? 'bg-primary w-8' : 'bg-border w-4'
            }`}
          />
        ))}
      </div>

      {/* ── Шаг 1: Email ── */}
      {step === 1 && (
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...emailForm.register('email')}
            />
            {emailForm.formState.errors.email && (
              <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full mt-2" disabled={emailForm.formState.isSubmitting}>
            {emailForm.formState.isSubmitting ? 'Отправка...' : 'Отправить код'}
          </Button>
        </form>
      )}

      {/* ── Шаг 2: Код ── */}
      {step === 2 && (
        <form onSubmit={codeForm.handleSubmit(onCodeSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">6-значный код</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="text-center text-2xl tracking-widest font-bold"
              {...codeForm.register('code')}
            />
            {codeForm.formState.errors.code && (
              <p className="text-xs text-destructive">{codeForm.formState.errors.code.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full mt-2">
            Подтвердить
          </Button>
          <button
            type="button"
            onClick={() => emailForm.handleSubmit(onEmailSubmit)()}
            className="text-sm text-center text-muted-foreground hover:text-primary transition-colors"
          >
            Отправить код повторно
          </button>
        </form>
      )}

      {/* ── Шаг 3: Новый пароль ── */}
      {step === 3 && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">Новый пароль</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-12"
                {...passwordForm.register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Повторите пароль</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-12"
                {...passwordForm.register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
          </Button>
        </form>
      )}

      {/* Ссылка назад */}
      <Link
        href="/auth/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Вернуться к входу
      </Link>
    </div>
  )
}
