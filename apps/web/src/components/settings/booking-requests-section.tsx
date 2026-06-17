'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { CalendarCheck, Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBookingRequests } from '@/hooks/use-availability'
import { toast } from '@/components/ui/use-toast'
import { getInitials } from '@tutorflow/utils'
import { useFormatters } from '@/i18n/use-formatters'

export function BookingRequestsSection() {
  const t = useTranslations('settingsSections')
  const f = useFormatters()
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
        title: status === 'CONFIRMED' ? t('bookingConfirmed') : t('bookingRejected'),
      })
    } catch {
      toast({ variant: 'destructive', title: t('error') })
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <div className="surface-1 rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-md bg-warning/12 flex items-center justify-center shrink-0">
          <CalendarCheck size={20} className="text-warning" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{t('bookingRequestsTitle')}</h3>
            {!loading && bookings.length > 0 && (
              <Badge variant="warning" className="text-[10px]">{bookings.length}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t('bookingRequestsSubtitle')}</p>
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
            <div key={booking.id} className="rounded-md border border-subtle bg-surface-0 p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={booking.student?.user?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{getInitials(booking.student?.name ?? '?')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{booking.student?.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} />
                    {format(new Date(booking.requestedAt), t('bookingDateFormat'), { locale: f.dateFnsLocale })}
                    {booking.slot && ` · ${t('minutesShort', { m: booking.slot.durationMinutes })}`}
                  </p>
                </div>
              </div>

              {booking.note && (
                <p className="text-xs text-muted-foreground bg-surface-2 rounded-md px-2.5 py-1.5 mb-2">
                  {booking.note}
                </p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={t('pricePlaceholder')}
                  value={priceMap[booking.id] ?? ''}
                  onChange={(e) => setPriceMap((p) => ({ ...p, [booking.id]: e.target.value }))}
                  className="tnum flex-1 text-xs border border-subtle rounded-md px-2.5 py-1.5 bg-surface-1 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/60"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/5 h-8"
                  onClick={() => handleRespond(booking.id, 'REJECTED')}
                  disabled={respondingId === booking.id}
                >
                  <X size={13} />
                  {t('reject')}
                </Button>
                <Button
                  size="sm"
                  className="gap-1 h-8"
                  onClick={() => handleRespond(booking.id, 'CONFIRMED')}
                  disabled={respondingId === booking.id}
                >
                  <Check size={13} />
                  {t('confirm')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
