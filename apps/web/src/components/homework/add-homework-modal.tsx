'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateHomework, uploadFiles } from '@/hooks/use-homework'
import { toast } from '@/components/ui/use-toast'
import { Paperclip, X, Loader2 } from 'lucide-react'

const schema = z.object({
  description: z.string().min(1, 'Описание обязательно').max(2000).trim(),
  deadline: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddHomeworkModalProps {
  open: boolean
  lessonId: string
  onClose: () => void
  onCreated?: () => void
}

export function AddHomeworkModal({ open, lessonId, onClose, onCreated }: AddHomeworkModalProps) {
  const { createHomework, loading } = useCreateHomework()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...selected].slice(0, 5))
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(data: FormData) {
    let attachmentUrls: string[] | undefined
    if (files.length > 0) {
      setUploading(true)
      try {
        attachmentUrls = await uploadFiles(files)
      } catch {
        toast({ variant: 'destructive', title: 'Ошибка загрузки файлов' })
        setUploading(false)
        return
      }
      setUploading(false)
    }

    try {
      await createHomework(lessonId, {
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        attachmentUrls,
      })
      toast({ variant: 'success', title: 'Домашнее задание добавлено' })
      handleClose()
      onCreated?.()
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Не удалось создать задание'
      toast({ variant: 'destructive', title: 'Ошибка', description: message })
    }
  }

  function handleClose() {
    reset()
    setFiles([])
    onClose()
  }

  const isBusy = uploading || loading

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Домашнее задание</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Описание */}
          <div className="flex flex-col gap-1.5">
            <Label>Задание</Label>
            <textarea
              {...register('description')}
              placeholder="Опишите задание для ученика..."
              rows={4}
              className="w-full rounded-2xl border border-input bg-secondary/50 px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-secondary resize-none"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Дедлайн */}
          <div className="flex flex-col gap-1.5">
            <Label>Дедлайн (необязательно)</Label>
            <Input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register('deadline')}
            />
          </div>

          {/* Файлы */}
          <div className="flex flex-col gap-2">
            <Label>Материалы (необязательно, до 5)</Label>

            {files.length > 0 && (
              <div className="flex flex-col gap-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
                    <Paperclip size={13} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground flex-1 truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-danger"
                    >
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

          <Button type="submit" className="w-full mt-2" disabled={isBusy}>
            {isBusy
              ? <><Loader2 size={14} className="animate-spin mr-2" />{uploading ? 'Загрузка...' : 'Сохранение...'}</>
              : 'Добавить задание'
            }
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
