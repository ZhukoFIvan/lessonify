'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useStudentDetail, useGenerateInvite, useDeleteStudent } from '@/hooks/use-students'
import { getInitials, formatRub } from '@tutorflow/utils'
import { format } from 'date-fns'
import {
  Link2, MessageCircle, Phone, Mail, Trash2, ChevronRight,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useFormatters } from '@/i18n/use-formatters'

const PAYMENT_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'secondary'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'danger',
}

interface StudentDetailModalProps {
  studentId: string | null
  open: boolean
  onClose: () => void
  onDeleted?: () => void
}

export function StudentDetailModal({ studentId, open, onClose, onDeleted }: StudentDetailModalProps) {
  const t = useTranslations('students')
  const f = useFormatters()

  const PAYMENT_LABELS: Record<string, string> = {
    PAID: t('payment.paid'),
    PENDING: t('payment.pending'),
    OVERDUE: t('payment.overdue'),
  }

  const { student, loading } = useStudentDetail(open ? studentId : null)
  const { generateInvite, loadingId: inviteLoadingId } = useGenerateInvite()
  const { deleteStudent, loadingId: deleteLoadingId } = useDeleteStudent()
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleCopyInvite() {
    if (!studentId) return
    try {
      const url = await generateInvite(studentId)
      await navigator.clipboard.writeText(url)
      toast({ variant: 'success', title: t('toast.linkCopied') })
    } catch {
      toast({ variant: 'destructive', title: t('toast.error'), description: t('toast.copyError') })
    }
  }

  async function handleDelete() {
    if (!studentId) return
    try {
      await deleteStudent(studentId)
      toast({ variant: 'success', title: t('toast.deleted') })
      setConfirmDelete(false)
      onClose()
      onDeleted?.()
    } catch {
      toast({ variant: 'destructive', title: t('toast.error'), description: t('toast.deleteError') })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setConfirmDelete(false); onClose() } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('detail.title')}</DialogTitle>
        </DialogHeader>

        {loading || !student ? (
          <div className="flex flex-col gap-4 mt-2">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-1">
            {/* ── Шапка профиля ── */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={student.user?.avatarUrl ?? undefined} />
                <AvatarFallback
                  className="text-lg font-bold text-white"
                  style={{ backgroundColor: student.color ?? '#6C63FF' }}
                >
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{student.name}</h2>
                {student.subject && (
                  <p className="text-sm text-muted-foreground">{student.subject}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {student.hourlyRate && (
                    <Badge variant="secondary">{formatRub(student.hourlyRate)}{t('perHour')}</Badge>
                  )}
                  {student.telegramConnected && (
                    <Badge variant="secondary" className="gap-1">
                      <MessageCircle size={11} />
                      {student.telegramUsername ? `@${student.telegramUsername}` : 'Telegram'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* ── Контакты ── */}
            {(student.email || student.phone) && (
              <div className="rounded-2xl border border-border p-4 flex flex-col gap-3">
                {student.email && (
                  <a
                    href={`mailto:${student.email}`}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <Mail size={16} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </a>
                )}
                {student.phone && (
                  <a
                    href={`tel:${student.phone}`}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <Phone size={16} className="text-muted-foreground shrink-0" />
                    <span>{student.phone}</span>
                  </a>
                )}
              </div>
            )}

            {/* ── Статистика ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-secondary/60 p-3 text-center">
                <p className="text-xl font-bold text-foreground">{student.lessonsCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {f.count(student.lessonsCount, 'lessons')}
                </p>
              </div>
              <div className={cn(
                'rounded-2xl p-3 text-center',
                student.debtAmount > 0 ? 'bg-danger/10' : 'bg-secondary/60',
              )}>
                <p className={cn(
                  'text-xl font-bold',
                  student.debtAmount > 0 ? 'text-danger' : 'text-foreground',
                )}>
                  {formatRub(student.debtAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('detail.debt')}</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-3 text-center">
                <p className="text-xl font-bold text-foreground">
                  {format(new Date(student.createdAt), 'MMM yy', { locale: f.dateFnsLocale })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('detail.added')}</p>
              </div>
            </div>

            {/* ── Заметки ── */}
            {student.notes && (
              <div className="rounded-2xl bg-secondary/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {t('detail.notes')}
                </p>
                <p className="text-sm text-foreground">{student.notes}</p>
              </div>
            )}

            {/* ── Пригласить ── */}
            {!student.userId && (
              <Button
                variant="secondary"
                className="w-full gap-2"
                onClick={handleCopyInvite}
                disabled={inviteLoadingId === studentId}
              >
                <Link2 size={16} />
                {inviteLoadingId === studentId ? t('detail.generating') : t('detail.copyInvite')}
              </Button>
            )}

            {/* ── История уроков ── */}
            {student.lessons && student.lessons.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t('detail.recentLessons')}
                </p>
                <div className="flex flex-col gap-2">
                  {student.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{lesson.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(lesson.startTime), 'd MMM, HH:mm', { locale: f.dateFnsLocale })}
                          {' · '}
                          {f.duration(lesson.durationMinutes)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={PAYMENT_VARIANT[lesson.paymentStatus] ?? 'secondary'}>
                          {PAYMENT_LABELS[lesson.paymentStatus]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatRub(lesson.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Удалить ── */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-danger transition-colors self-center mt-1"
              >
                <Trash2 size={13} />
                {t('detail.deleteStudent')}
              </button>
            ) : (
              <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4 flex flex-col gap-3">
                <p className="text-sm text-foreground font-medium">
                  {t.rich('detail.deleteConfirm', {
                    name: student.name,
                    b: (chunks) => <span className="font-bold">{chunks}</span>,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmDelete(false)}
                  >
                    {t('detail.cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleDelete}
                    disabled={deleteLoadingId === studentId}
                  >
                    {deleteLoadingId === studentId ? t('detail.deleting') : t('detail.delete')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
