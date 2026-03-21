'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarCheck, Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBookingRequests } from '@/hooks/use-availability'
import { toast } from '@/components/ui/use-toast'
import { getInitials } from '@tutorflow/utils'

export function BookingRequestsSection() {
  const { bookings, loading, respond } = useBookingRequests('PENDING')
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [priceMap, setPriceMap] = useState<Record<string, string>>({})

  if (!loading && bookings.length === 0) return null

  async function handleRespond(bookingId: string, status: 'CONFIRMED' | 'REJECTED') {
    setRespondingId(bookingId)
    try {
      const priceStr = priceMap[bookingId]
      const price = priceStr ? parseInt(priceStr) : undefined
      await respond(bookingId, status, price)
      toast({
        variant: status === 'CONFIRMED' ? 'success' : 'default',
        title: status === 'CONFIRMED' ? 'Запись подтверждена' : 'Запись отклонена',
      })
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка' })
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
          <CalendarCheck size={20} className="text-warning" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Запросы на запись</h3>
            {!loading && bookings.length > 0 && (
              <Badge variant="warning" className="text-[10px]">{bookings.length}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Ученики хотят записаться на урок</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={booking.student?.user?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(booking.student?.name ?? '?')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{booking.student?.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} />
                    {format(new Date(booking.requestedAt), "d MMM, EEEE 'в' HH:mm", { locale: ru })}
                    {booking.slot && ` · ${booking.slot.durationMinutes} мин`}
                  </p>
                </div>
              </div>

              {booking.note && (
                <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2.5 py-1.5 mb-2">
                  {booking.note}
                </p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Цена (₽)"
                  value={priceMap[booking.id] ?? ''}
                  onChange={(e) => setPriceMap((p) => ({ ...p, [booking.id]: e.target.value }))}
                  className="flex-1 text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/5 h-8"
                  onClick={() => handleRespond(booking.id, 'REJECTED')}
                  disabled={respondingId === booking.id}
                >
                  <X size={13} />
                  Отклонить
                </Button>
                <Button
                  size="sm"
                  className="gap-1 h-8"
                  onClick={() => handleRespond(booking.id, 'CONFIRMED')}
                  disabled={respondingId === booking.id}
                >
                  <Check size={13} />
                  Подтвердить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
