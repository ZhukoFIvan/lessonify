'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, differenceInDays } from 'date-fns'
import { getInitials } from '@tutorflow/utils'
import { Clock, CheckCircle2, MessageSquare, Paperclip, FileText } from 'lucide-react'
import type { HomeworkWithDetails } from '@tutorflow/types'
import { useFormatters } from '@/i18n/use-formatters'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
  ASSIGNED: 'warning',
  SUBMITTED: 'default',
  REVIEWED: 'success',
}

interface TutorHomeworkCardProps {
  item: HomeworkWithDetails
  onReview?: (id: string, feedback: string) => Promise<void>
  reviewLoading?: boolean
}

export function TutorHomeworkCard({ item, onReview, reviewLoading }: TutorHomeworkCardProps) {
  const t = useTranslations('homework')
  const f = useFormatters()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  const statusVariant = STATUS_VARIANT[item.status] ?? STATUS_VARIANT['ASSIGNED']!
  const statusLabel = t(`status.${item.status}`)
  const isSubmitted = item.status === 'SUBMITTED'
  const isReviewed = item.status === 'REVIEWED'
  const isOverdue = item.isOverdue

  const deadlineDate = item.deadline ? new Date(item.deadline) : null
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null

  function deadlineLabel(): string {
    if (!deadlineDate) return ''
    if (isOverdue && item.status === 'ASSIGNED') return t('deadline.overdue')
    if (daysLeft === 0) return t('deadline.today')
    if (daysLeft === 1) return t('deadline.tomorrow')
    return format(deadlineDate, 'd MMM', { locale: f.dateFnsLocale })
  }

  async function handleReview() {
    await onReview?.(item.id, feedback.trim())
    setReviewOpen(false)
    setFeedback('')
  }

  function getFileName(url: string) {
    return decodeURIComponent(url.split('/').pop() ?? url).replace(/^[a-f0-9]{32}/, '').replace(/^[-_]/, '') || t('file')
  }

  const isOverdueAssigned = isOverdue && item.status === 'ASSIGNED'

  return (
    <Card
      className={cn(
        'card-hover overflow-hidden h-full',
        isOverdueAssigned && 'ring-1 ring-inset ring-danger/30',
        isSubmitted && 'ring-1 ring-inset ring-primary/25',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Цветная полоска + аватар ученика */}
          <div
            className="w-1 self-stretch rounded-full shrink-0"
            style={{ backgroundColor: item.student.color ?? '#6C63FF' }}
          />
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src={item.student.user?.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(item.student.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Имя + статус */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-semibold text-foreground truncate">{item.student.name}</p>
              <Badge variant={statusVariant} className="shrink-0">{statusLabel}</Badge>
            </div>

            {/* Предмет + дата урока */}
            <p className="text-xs text-muted-foreground tnum">
              {item.lesson.subject} · {format(new Date(item.lesson.startTime), 'd MMM', { locale: f.dateFnsLocale })}
            </p>

            {/* Дедлайн */}
            {deadlineDate && (
              <div className="mt-2 inline-flex items-center gap-1.5">
                <Clock
                  size={12}
                  className={cn(isOverdueAssigned ? 'text-danger' : 'text-muted-foreground')}
                />
                <span className={cn('text-xs', isOverdueAssigned ? 'text-danger font-semibold' : 'text-muted-foreground')}>
                  {deadlineLabel()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Описание задания */}
        <p className="text-sm text-foreground leading-snug mt-3">{item.description}</p>

        {/* Прикреплённые материалы репетитора */}
        {item.attachmentUrls.length > 0 && (
          <div className="flex flex-col gap-1 mt-2.5">
            {item.attachmentUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <Paperclip size={11} className="shrink-0" />
                <span className="truncate">{getFileName(url)}</span>
              </a>
            ))}
          </div>
        )}

        {/* Ответ ученика */}
        {(isSubmitted || isReviewed) && (item.submissionText || item.fileUrls.length > 0) && (
          <div className="rounded-md bg-surface-0 border border-[var(--border-subtle)] p-3 mt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold">{t('studentAnswer')}</p>
            {item.submissionText && (
              <p className="text-sm text-foreground leading-snug">{item.submissionText}</p>
            )}
            {item.fileUrls.length > 0 && (
              <div className="flex flex-col gap-1">
                {item.fileUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <FileText size={12} className="shrink-0" />
                    <span className="truncate">{getFileName(url)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Фидбек репетитора */}
        {isReviewed && item.feedback && (
          <div className="rounded-md bg-success/[0.07] border border-success/20 p-3 mt-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare size={12} className="text-success" />
              <span className="text-xs font-semibold text-success">{t('yourReview')}</span>
            </div>
            <p className="text-xs text-foreground leading-snug">{item.feedback}</p>
          </div>
        )}

        {/* Кнопка проверки */}
        {isSubmitted && onReview && (
          <Button
            size="sm"
            variant="secondary"
            className="w-full gap-1.5 mt-3"
            onClick={() => setReviewOpen(true)}
            disabled={reviewLoading}
          >
            <CheckCircle2 size={14} />
            {t('reviewTask')}
          </Button>
        )}
      </CardContent>

      {/* Модалка ревью */}
      <Dialog open={reviewOpen} onOpenChange={(v) => !v && setReviewOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('review.title')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-surface-0 border border-[var(--border-subtle)] p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Ответ ученика</p>
              {item.submissionText
                ? <p className="text-sm text-foreground leading-snug">{item.submissionText}</p>
                : (!item.fileUrls.length && <p className="text-xs text-muted-foreground italic">{t('review.noComment')}</p>)
              }
              {item.fileUrls.length > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  {item.fileUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Paperclip size={12} className="shrink-0" />
                      <span className="truncate">{getFileName(url)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                {t('review.feedbackLabel')}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('review.feedbackPlaceholder')}
                rows={3}
                className="w-full rounded-md border border-[var(--border-subtle)] bg-surface-0 px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setReviewOpen(false)}
                disabled={reviewLoading}
              >
                {t('cancel')}
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-white"
                onClick={handleReview}
                disabled={reviewLoading}
              >
                <CheckCircle2 size={14} />
                {reviewLoading ? t('saving') : t('review.confirm')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
