'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, differenceInDays } from 'date-fns'
import { getInitials } from '@tutorflow/utils'
import { Clock, CheckCircle2, MessageSquare, Paperclip, X, Loader2 } from 'lucide-react'
import type { StudentHomeworkItem } from '@tutorflow/types'
import { uploadFiles } from '@/hooks/use-homework'
import { useFormatters } from '@/i18n/use-formatters'
import { cn } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'secondary' | 'warning' | 'success' | 'default'> = {
  ASSIGNED: 'warning',
  SUBMITTED: 'default',
  REVIEWED: 'success',
}

interface HomeworkCardProps {
  item: StudentHomeworkItem
  onSubmit?: (id: string, submissionText?: string, fileUrls?: string[]) => void
  submitLoading?: boolean
}

export function HomeworkCard({ item, onSubmit, submitLoading }: HomeworkCardProps) {
  const t = useTranslations('homework')
  const f = useFormatters()
  const [submitOpen, setSubmitOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const statusVariant = STATUS_VARIANT[item.status] ?? STATUS_VARIANT['ASSIGNED']!
  const statusLabel = t(`status.${item.status}`)
  const isAssigned = item.status === 'ASSIGNED'
  const isReviewed = item.status === 'REVIEWED'
  const hasDeadline = !!item.deadline

  const deadlineDate = hasDeadline ? new Date(item.deadline!) : null
  const isOverdue = item.isOverdue
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null

  function deadlineLabel(): string {
    if (!deadlineDate) return ''
    if (isOverdue) return t('deadline.overdue')
    if (daysLeft === 0) return t('deadline.today')
    if (daysLeft === 1) return t('deadline.tomorrow')
    return format(deadlineDate, 'd MMM', { locale: f.dateFnsLocale })
  }

  function handleClose() {
    setSubmitOpen(false)
    setComment('')
    setFiles([])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...selected].slice(0, 5))
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    let fileUrls: string[] | undefined
    if (files.length > 0) {
      setUploading(true)
      try {
        fileUrls = await uploadFiles(files)
      } catch {
        setUploading(false)
        return
      }
      setUploading(false)
    }
    onSubmit?.(item.id, comment.trim() || undefined, fileUrls)
    handleClose()
  }

  function getFileName(url: string) {
    return decodeURIComponent(url.split('/').pop() ?? url).replace(/^[a-f0-9]{32}/, '').replace(/^[-_]/, '') || t('file')
  }

  const isBusy = uploading || submitLoading
  const isOverdueAssigned = isOverdue && isAssigned

  return (
    <Card
      className={cn(
        'card-hover overflow-hidden h-full',
        isOverdueAssigned
          ? 'ring-1 ring-inset ring-danger/30'
          : isAssigned && 'ring-1 ring-inset ring-primary/25',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src={item.tutor.user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(item.tutor.user.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-semibold text-foreground truncate">{item.lesson.subject}</p>
              <Badge variant={statusVariant} className="shrink-0">{statusLabel}</Badge>
            </div>

            <p className="text-xs text-muted-foreground truncate">{item.tutor.user.name}</p>

            {hasDeadline && (
              <div className="mt-2 inline-flex items-center gap-1.5">
                <Clock size={12} className={cn(isOverdueAssigned ? 'text-danger' : 'text-muted-foreground')} />
                <span className={cn('text-xs', isOverdueAssigned ? 'text-danger font-semibold' : 'text-muted-foreground')}>
                  {deadlineLabel()}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-foreground leading-snug mt-3">{item.description}</p>

        {/* Материалы от репетитора */}
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

        {isReviewed && item.feedback && (
          <div className="rounded-md bg-success/[0.07] border border-success/20 p-3 mt-3">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare size={12} className="text-success" />
              <span className="text-xs font-semibold text-success">{t('feedback')}</span>
            </div>
            <p className="text-xs text-foreground leading-snug">{item.feedback}</p>
          </div>
        )}

        {item.status !== 'ASSIGNED' && (item.submissionText || item.fileUrls.length > 0) && (
          <div className="rounded-md bg-surface-0 border border-[var(--border-subtle)] p-3 mt-3 space-y-1.5">
            <p className="text-xs text-muted-foreground font-semibold">{t('yourAnswer')}</p>
            {item.submissionText && <p className="text-xs text-foreground leading-snug">{item.submissionText}</p>}
            {item.fileUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <Paperclip size={11} className="shrink-0" />
                <span className="truncate">{getFileName(url)}</span>
              </a>
            ))}
          </div>
        )}

        {isAssigned && onSubmit && (
          <Button
            size="sm"
            className="w-full gap-1.5 mt-3"
            onClick={() => setSubmitOpen(true)}
            disabled={submitLoading}
          >
            <CheckCircle2 size={14} />
            {submitLoading ? t('submitting') : t('submitTask')}
          </Button>
        )}
      </CardContent>

      <Dialog open={submitOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('submitTask')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-surface-0 border border-[var(--border-subtle)] p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">{t('modal.taskLabel')}</p>
              <p className="text-sm text-foreground line-clamp-3 leading-snug">{item.description}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t('submit.commentLabel')}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('submit.commentPlaceholder')}
                rows={3}
                className="w-full rounded-md border border-[var(--border-subtle)] bg-surface-0 px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-colors"
              />
            </div>

            {/* Файлы */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">{t('submit.filesLabel')}</label>

              {files.length > 0 && (
                <div className="flex flex-col gap-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md bg-surface-2 border border-[var(--border-subtle)] px-3 py-2">
                      <Paperclip size={13} className="text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-danger transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length < 5 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-md border-2 border-dashed border-[var(--border-strong)] px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Paperclip size={15} />
                    {t('attachFile')}
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={isBusy}>
                {t('cancel')}
              </Button>
              <Button className="flex-1 gap-1.5" onClick={handleSubmit} disabled={isBusy}>
                {isBusy
                  ? <><Loader2 size={14} className="animate-spin" /> {uploading ? t('uploading') : t('submitting')}</>
                  : <><CheckCircle2 size={14} /> {t('submit.confirm')}</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
