'use client'

import { useState } from 'react'
import { FileDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStudents } from '@/hooks/use-students'
import { useDownloadInvoice } from '@/hooks/use-invoice'
import { toast } from '@/components/ui/use-toast'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface InvoiceModalProps {
  open: boolean
  onClose: () => void
}

export function InvoiceModal({ open, onClose }: InvoiceModalProps) {
  const { students } = useStudents()
  const { downloadInvoice, loading } = useDownloadInvoice()

  const today = new Date()
  const [studentId, setStudentId] = useState('')
  const [from, setFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(endOfMonth(today), 'yyyy-MM-dd'))

  const selectedStudent = students.find((s) => s.id === studentId)

  async function handleDownload() {
    if (!studentId) {
      toast({ variant: 'destructive', title: 'Выберите ученика' })
      return
    }
    try {
      await downloadInvoice(studentId, selectedStudent?.name ?? 'ученик', from, to)
      toast({ variant: 'success', title: 'Счёт скачан' })
      onClose()
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сформировать PDF' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown size={18} className="text-primary" />
            Сформировать счёт
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Ученик */}
          <div className="flex flex-col gap-1.5">
            <Label>Ученик</Label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-12 w-full rounded-2xl border border-input bg-secondary/50 px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-secondary"
            >
              <option value="">Выберите ученика...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.subject ? ` · ${s.subject}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Период */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label>С</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full max-w-full overflow-hidden"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label>По</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full max-w-full overflow-hidden"
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              <X size={14} className="mr-1.5" />
              Отмена
            </Button>
            <Button className="flex-1 gap-1.5" onClick={handleDownload} disabled={loading || !studentId}>
              <FileDown size={14} />
              {loading ? 'Формируем...' : 'Скачать PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
