'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getInitials } from '@tutorflow/utils'
import { Clock, CheckCircle2, MessageSquare, Paperclip, FileText } from 'lucide-react'
import type { HomeworkWithDetails } from '@tutorflow/types'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; variant: 'secondary' | 'warning' | 'success' | 'default' }> = {
  ASSIGNED: { label: 'Задано', variant: 'warning' },
  SUBMITTED: { label: 'Сдано', variant: 'default' },
  REVIEWED: { label: 'Проверено', variant: 'success' },
}

interface TutorHomeworkCardProps {
  item: HomeworkWithDetails
  onReview?: (id: string, feedback: string) => Promise<void>
  reviewLoading?: boolean
}

export function TutorHomeworkCard({ item, onReview, reviewLoading }: TutorHomeworkCardProps) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const [feedback, setFeedback] = useState('')

  const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['ASSIGNED']!
  const isSubmitted = item.status === 'SUBMITTED'
  const isReviewed = item.status === 'REVIEWED'
  const isOverdue = item.isOverdue

  const deadlineDate = item.deadline ? new Date(item.deadline) : null
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null

  function deadlineLabel(): string {
    if (!deadlineDate) return ''
    if (isOverdue && item.status === 'ASSIGNED') return 'Просрочено'
    if (daysLeft === 0) return 'Сегодня'
    if (daysLeft === 1) return 'Завтра'
    return format(deadlineDate, 'd MMM', { locale: ru })
  }

  async function handleReview() {
    await onReview?.(item.id, feedback.trim())
    setReviewOpen(false)
    setFeedback('')
  }

  function getFileName(url: string) {
    return decodeURIComponent(url.split('/').pop() ?? url).replace(/^[a-f0-9]{32}/, '').replace(/^[-_]/, '') || 'Файл'
  }

  return (
    <Card className={cn(isOverdue && item.status === 'ASSIGNED' && 'border-danger/40')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Цветная полоска + аватар ученика */}
          <div
            className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: item.student.color ?? '#6C63FF' }}
          />
          <Avatar className="w-9 h-9 shrink-0 mt-0.5">
            <AvatarImage src={item.student.user?.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(item.student.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Имя + статус */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-semibold text-foreground truncate">{item.student.name}</p>
              <Badge variant={config.variant} className="shrink-0">{config.label}</Badge>
            </div>

            {/* Предмет + дата урока */}
            <p className="text-xs text-muted-foreground mb-2">
              {item.lesson.subject} · {format(new Date(item.lesson.startTime), 'd MMM', { locale: ru })}
            </p>

            {/* Описание задания */}
            <p className="text-sm text-foreground leading-snug mb-2">{item.description}</p>

            {/* Прикреплённые материалы репетитора */}
            {item.attachmentUrls.length > 0 && (
              <div className="flex flex-col gap-1 mb-3">
                {item.attachmentUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                    <Paperclip size={11} />
                    {getFileName(url)}
                  </a>
                ))}
              </div>
            )}

            {/* Дедлайн */}
            {deadlineDate && (
              <div className="flex items-center gap-1.5 mb-3">
                <Clock
                  size={12}
                  className={cn(isOverdue && item.status === 'ASSIGNED' ? 'text-danger' : 'text-muted-foreground')}
                />
                <span className={cn('text-xs', isOverdue && item.status === 'ASSIGNED' ? 'text-danger font-medium' : 'text-muted-foreground')}>
                  {deadlineLabel()}
                </span>
              </div>
            )}

            {/* Ответ ученика */}
            {(isSubmitted || isReviewed) && (item.submissionText || item.fileUrls.length > 0) && (
              <div className="rounded-xl bg-secondary p-3 mb-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Ответ ученика</p>
                {item.submissionText && (
                  <p className="text-sm text-foreground">{item.submissionText}</p>
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
                        <FileText size={12} />
                        {getFileName(url)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Фидбек репетитора */}
            {isReviewed && item.feedback && (
              <div className="rounded-xl bg-success/5 border border-success/20 p-3 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare size={12} className="text-success" />
                  <span className="text-xs font-semibold text-success">Ваш отзыв</span>
                </div>
                <p className="text-xs text-foreground">{item.feedback}</p>
              </div>
            )}

            {/* Кнопка проверки */}
            {isSubmitted && onReview && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full gap-1.5 border-success/30 text-success hover:bg-success/10"
                onClick={() => setReviewOpen(true)}
                disabled={reviewLoading}
              >
                <CheckCircle2 size={14} />
                Проверить задание
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Модалка ревью */}
      <Dialog open={reviewOpen} onOpenChange={(v) => !v && setReviewOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Проверка задания</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Ответ ученика</p>
              {item.submissionText
                ? <p className="text-sm text-foreground">{item.submissionText}</p>
                : (!item.fileUrls.length && <p className="text-xs text-muted-foreground italic">Без комментария</p>)
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
                      <Paperclip size={12} />
                      {getFileName(url)}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Обратная связь (необязательно)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Напишите комментарий к работе ученика..."
                rows={3}
                className="w-full rounded-2xl border border-input bg-secondary/50 px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-secondary resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setReviewOpen(false)}
                disabled={reviewLoading}
              >
                Отмена
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-white"
                onClick={handleReview}
                disabled={reviewLoading}
              >
                <CheckCircle2 size={14} />
                {reviewLoading ? 'Сохранение...' : 'Отметить проверенным'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
