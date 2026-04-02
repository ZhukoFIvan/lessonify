'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, SkipForward, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

interface StepTelegramProps {
  onNext: () => void
  onBack: () => void
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function StepTelegram({ onNext, onBack }: StepTelegramProps) {
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    async function fetchLink() {
      try {
        const { data } = await api.get('/telegram/link')
        setDeepLink(data.data.deepLink)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchLink()
  }, [])

  useEffect(() => {
    if (!deepLink || connected) return

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/telegram/status')
        if (data.data?.connected) {
          setConnected(true)
          clearInterval(interval)
        }
      } catch {
        // ignore
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [deepLink, connected])

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col px-2"
    >
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Подключите Telegram
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Получайте напоминания об уроках и оплатах прямо в мессенджер
        </p>
      </motion.div>

      <motion.div
        variants={item}
        className="mt-8 flex flex-col items-center"
      >
        {/* Telegram icon */}
        <motion.div
          animate={connected ? {} : { y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mb-6"
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${connected ? 'bg-green-500 shadow-green-500/20' : 'bg-[#0088cc] shadow-[#0088cc]/20'}`}>
            {connected ? (
              <CheckCircle2 size={36} className="text-white" />
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.58-.46.72-.93.45l-2.57-1.9-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.61 4.74-4.28c.21-.18-.04-.28-.31-.1l-5.85 3.69-2.52-.79c-.55-.17-.56-.55.12-.82l9.83-3.79c.46-.17.86.11.75.74z" />
              </svg>
            )}
          </div>
          {!connected && (
            <motion.div
              className="absolute inset-0 rounded-3xl bg-[#0088cc]/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          )}
        </motion.div>

        {connected ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              Telegram подключён!
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              Уведомления будут приходить в бот
            </p>
          </motion.div>
        ) : loading ? (
          <Loader2 size={24} className="text-muted-foreground animate-spin" />
        ) : deepLink ? (
          <div className="flex flex-col items-center gap-3">
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0088cc] text-white font-medium hover:bg-[#0077b5] transition-colors shadow-md shadow-[#0088cc]/20"
            >
              Открыть бот
              <ExternalLink size={16} />
            </a>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Нажмите «Start» в боте — мы автоматически определим подключение
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Не удалось получить ссылку. Можно подключить позже в настройках.
          </p>
        )}
      </motion.div>

      {/* Benefits */}
      <motion.div variants={item} className="mt-8 space-y-2.5">
        {[
          'Напоминание за 1 час до урока',
          'Уведомление о новом домашнем задании',
          'Сводка по оплатам за неделю',
        ].map((text, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            {text}
          </div>
        ))}
      </motion.div>

      {/* Navigation */}
      <motion.div variants={item} className="flex gap-3 mt-8">
        <Button variant="outline" onClick={onBack} size="lg" className="px-4">
          <ArrowLeft size={18} />
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          variant={connected ? 'default' : 'outline'}
          className="flex-1 group"
        >
          {connected ? (
            <>
              Далее
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </>
          ) : (
            <>
              <SkipForward size={18} className="mr-2" />
              Настрою позже
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
