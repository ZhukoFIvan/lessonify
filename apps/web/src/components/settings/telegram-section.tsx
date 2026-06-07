'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useTelegramStatus, useGetTelegramLink, useDisconnectTelegram } from '@/hooks/use-telegram'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { MessageCircle, ExternalLink, Unlink } from 'lucide-react'

export function TelegramSection() {
  const { status, loading, refetch } = useTelegramStatus()
  const { getLink } = useGetTelegramLink()
  const { disconnect, loading: disconnectLoading } = useDisconnectTelegram()
  const [deepLink, setDeepLink] = useState<string | null>(null)
  const requested = useRef(false)

  // Заранее получаем deep-link с кодом привязки, чтобы кнопка была НАСТОЯЩЕЙ ссылкой
  // <a href>. window.open после await часто блокируется браузером/PWA и теряет код —
  // тогда человек жмёт Start без кода, и привязка не происходит.
  useEffect(() => {
    if (loading || status?.connected || deepLink || requested.current) return
    requested.current = true
    getLink()
      .then((r) => setDeepLink(r.deepLink))
      .catch(() => {
        requested.current = false
      })
    // getLink стабилен по смыслу; не включаем в deps, чтобы не дёргать новый код каждый рендер.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, status?.connected, deepLink])

  // После клика по ссылке опрашиваем статус, чтобы автоматически поймать привязку.
  function handleConnectClick() {
    toast({
      title: 'Открываем Telegram',
      description: 'Нажмите «Start» в боте — привязка определится автоматически.',
    })
    let tries = 0
    const id = setInterval(async () => {
      tries += 1
      await refetch()
      if (tries >= 12) clearInterval(id)
    }, 2500)
  }

  async function handleDisconnect() {
    try {
      await disconnect()
      setDeepLink(null)
      requested.current = false
      toast({ variant: 'success', title: 'Telegram отключён' })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отключить Telegram' })
    }
  }

  return (
    <div className="surface-1 rounded-lg p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-[#229ED9]/12 flex items-center justify-center shrink-0">
          <MessageCircle size={20} className="text-[#229ED9]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground">Telegram</p>
            {!loading && status?.connected && (
              <Badge variant="success" className="text-[10px]">Подключён</Badge>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : status?.connected ? (
            <p className="text-xs text-muted-foreground">
              {status.firstName ?? ''}{status.username ? ` · @${status.username}` : ''}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Получайте напоминания об уроках в Telegram
            </p>
          )}

          <div className="mt-3">
            {loading ? (
              <Skeleton className="h-9 w-32 rounded-full" />
            ) : status?.connected ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/5"
                onClick={handleDisconnect}
                disabled={disconnectLoading}
              >
                <Unlink size={13} />
                {disconnectLoading ? 'Отключение...' : 'Отключить'}
              </Button>
            ) : (
              <a
                href={deepLink ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={deepLink ? handleConnectClick : undefined}
                aria-disabled={!deepLink}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-white transition-colors bg-[#229ED9] hover:bg-[#1a8bc4]',
                  !deepLink && 'pointer-events-none opacity-60',
                )}
              >
                <ExternalLink size={13} />
                {deepLink ? 'Открыть бота и подключить' : 'Загрузка...'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
