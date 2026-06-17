'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface InvitePageProps {
  params: { token: string }
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter()
  const t = useTranslations('invite')
  const { user, accessToken } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const hasAttempted = useRef(false)

  // Ждём гидрации Zustand store из localStorage
  useEffect(() => {
    const timer = setTimeout(() => setIsChecking(false), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isChecking || hasAttempted.current) return

    hasAttempted.current = true

    // Не залогинен — идём на регистрацию с токеном в URL
    if (!user || !accessToken) {
      router.push(`/auth/register?invite=${params.token}`)
      return
    }

    // Залогинен — принимаем приглашение
    api.post('/students/accept-invite', { token: params.token })
      .then(() => {
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 800)
      })
      .catch((err) => {
        setStatus('error')
        setErrorMessage(err?.response?.data?.error || t('acceptFailed'))
      })
  }, [user, accessToken, params.token, router, isChecking])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl border border-border p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-xl font-bold text-foreground mb-2">{t('loading.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('loading.subtitle')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">{t('success.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('success.subtitle')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">{t('error.title')}</h1>
            <p className="text-sm text-destructive mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-primary font-semibold"
            >
              {t('error.backToDashboard')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
