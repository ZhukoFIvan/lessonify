'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useTelegramStatus, useGetTelegramLink, useDisconnectTelegram } from '@/hooks/use-telegram'
import { toast } from '@/components/ui/use-toast'
import { MessageCircle, ExternalLink, Unlink } from 'lucide-react'

export function TelegramSection() {
  const { status, loading, refetch } = useTelegramStatus()
  const { getLink, loading: linkLoading } = useGetTelegramLink()
  const { disconnect, loading: disconnectLoading } = useDisconnectTelegram()

  async function handleConnect() {
    try {
      const { deepLink } = await getLink()
      // Открываем deep link в новой вкладке (в PWA — приложение Telegram)
      window.open(deepLink, '_blank')
      toast({
        variant: 'default',
        title: 'Откройте Telegram',
        description: 'Нажмите Start в боте для привязки аккаунта',
      })
      // Через 5 сек проверяем статус
      setTimeout(refetch, 5000)
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось получить ссылку' })
    }
  }

  async function handleDisconnect() {
    try {
      await disconnect()
      toast({ variant: 'success', title: 'Telegram отключён' })
      refetch()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отключить Telegram' })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[#229ED9]/10 flex items-center justify-center shrink-0">
          <MessageCircle size={22} className="text-[#229ED9]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-base font-semibold text-foreground">Telegram</p>
            {!loading && status?.connected && (
              <Badge variant="success" className="text-[10px]">Подключён</Badge>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : status?.connected ? (
            <p className="text-sm text-muted-foreground">
              {status.firstName ?? ''}{status.username ? ` · @${status.username}` : ''}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
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
              <Button
                size="sm"
                className="gap-1.5 bg-[#229ED9] hover:bg-[#1a8bc4]"
                onClick={handleConnect}
                disabled={linkLoading}
              >
                <ExternalLink size={13} />
                {linkLoading ? 'Загрузка...' : 'Подключить'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
