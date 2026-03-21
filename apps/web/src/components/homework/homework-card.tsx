'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, differenceInDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getInitials } from '@tutorflow/utils'
import { Clock, CheckCircle2, MessageSquare, Paperclip, X, Loader2 } from 'lucide-react'
import type { StudentHomeworkItem } from '@tutorflow/types'
import { uploadFiles } from '@/hooks/use-homework'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'secondary' | 'warning' | 'success' | 'default' }
> = {
  ASSIGNED: { label: 'Задано', variant: 'warning' },
  SUBMITTED: { label: 'Сдано', variant: 'default' },
  REVIEWED: { label: 'Проверено', variant: 'success' },
}

interface HomeworkCardProps {
  item: StudentHomeworkItem
  onSubmit?: (id: string, submissionText?: string, fileUrls?: string[]) => void
  submitLoading?: boolean
}

export function HomeworkCard({ item, onSubmit, submitLoading }: HomeworkCardProps) {
  const [submitOpen, setSubmitOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['ASSIGNED']!
  const isAssigned = item.status === 'ASSIGNED'
  const isReviewed = item.status === 'REVIEWED'
  const hasDeadline = !!item.deadline

  const deadlineDate = hasDeadline ? new Date(item.deadline!) : null
  const isOverdue = item.isOverdue
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null

  function deadlineLabel(): string {
    if (!deadlineDate) return ''
    if (isOverdue) return 'Просрочено'
    if (daysLeft === 0) return 'Сегодня'
    if (daysLeft === 1) return 'Завтра'
    return format(deadlineDate, 'd MMM', { locale: ru })
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
    return decodeURIComponent(url.split('/').pop() ?? url).replace(/^[a-f0-9]{32}/, '').replace(/^[-_]/, '') || 'Файл'
  }

  const isBusy = uploading || submitLoading

  return (
    <Card className={cn(isOverdue && isAssigned && 'border-danger/40')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-9 h-9 shrink-0 mt-0.5">
            <AvatarImage src={item.tutor.user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(item.tutor.user.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground truncate">{item.lesson.subject}</p>
              <Badge variant={config.variant} className="shrink-0">{config.label}</Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-2">{item.tutor.user.name}</p>
            <p className="text-sm text-foreground leading-snug mb-2">{item.description}</p>

            {/* Материалы от репетитора */}
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

            {hasDeadline && (
              <div className="flex items-center gap-1.5 mb-3">
                <Clock size={12} className={cn(isOverdue && isAssigned ? 'text-danger' : 'text-muted-foreground')} />
                <span className={cn('text-xs', isOverdue && isAssigned ? 'text-danger font-medium' : 'text-muted-foreground')}>
                  {deadlineLabel()}
                </span>
              </div>
            )}

            {isReviewed && item.feedback && (
              <div className="rounded-xl bg-success/5 border border-success/20 p-3 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare size={12} className="text-success" />
                  <span className="text-xs font-semibold text-success">Обратная связь</span>
                </div>
                <p className="text-xs text-foreground">{item.feedback}</p>
              </div>
            )}

            {isAssigned && onSubmit && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => setSubmitOpen(true)}
                disabled={submitLoading}
              >
                <CheckCircle2 size={14} />
                {submitLoading ? 'Отправка...' : 'Сдать задание'}
              </Button>
            )}

            {item.status !== 'ASSIGNED' && (item.submissionText || item.fileUrls.length > 0) && (
              <div className="rounded-xl bg-secondary p-3 mt-1 space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Ваш ответ</p>
                {item.submissionText && <p className="text-xs text-foreground">{item.submissionText}</p>}
                {item.fileUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Paperclip size={11} />
                    {getFileName(url)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={submitOpen} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сдать задание</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Задание</p>
              <p className="text-sm text-foreground line-clamp-3">{item.description}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Комментарий (необязательно)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Напишите комментарий к выполненному заданию..."
                rows={3}
                className="w-full rounded-2xl border border-input bg-secondary/50 px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-secondary resize-none"
              />
            </div>

            {/* Файлы */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Файлы (необязательно, до 5)</label>

              {files.length > 0 && (
                <div className="flex flex-col gap-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
                      <Paperclip size={13} className="text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-danger">
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
                    className="flex items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Paperclip size={15} />
                    Прикрепить файл
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={isBusy}>
                Отмена
              </Button>
              <Button className="flex-1 gap-1.5" onClick={handleSubmit} disabled={isBusy}>
                {isBusy
                  ? <><Loader2 size={14} className="animate-spin" /> {uploading ? 'Загрузка...' : 'Отправка...'}</>
                  : <><CheckCircle2 size={14} /> Сдать</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
