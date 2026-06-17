'use client'

import { useState } from 'react'
import { FileDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStudents } from '@/hooks/use-students'
import { useDownloadInvoice } from '@/hooks/use-invoice'
import { toast } from '@/components/ui/use-toast'
import { useTranslations } from 'next-intl'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface InvoiceModalProps {
  open: boolean
  onClose: () => void
}

export function InvoiceModal({ open, onClose }: InvoiceModalProps) {
  const t = useTranslations('finances')
  const { students } = useStudents()
  const { downloadInvoice, loading } = useDownloadInvoice()

  const today = new Date()
  const [studentId, setStudentId] = useState('')
  const [from, setFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(endOfMonth(today), 'yyyy-MM-dd'))

  const selectedStudent = students.find((s) => s.id === studentId)

  async function handleDownload() {
    if (!studentId) {
      toast({ variant: 'destructive', title: t('selectStudent') })
      return
    }
    const all = studentId === 'ALL'
    try {
      await downloadInvoice(all ? undefined : studentId, all ? t('allStudentsFilename') : (selectedStudent?.name ?? t('studentFilename')), from, to)
      toast({ variant: 'success', title: t('invoiceDownloaded') })
      onClose()
    } catch {
      toast({ variant: 'destructive', title: t('error'), description: t('pdfFailed') })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown size={18} className="text-primary" />
            {t('generateInvoice')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Ученик */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('student')}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectStudentPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('allStudentsOption')}</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.subject ? ` · ${s.subject}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Период */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label>{t('dateFrom')}</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full max-w-full overflow-hidden"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label>{t('dateTo')}</Label>
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
              {t('cancel')}
            </Button>
            <Button className="flex-1 gap-1.5" onClick={handleDownload} disabled={loading || !studentId}>
              <FileDown size={14} />
              {loading ? t('generating') : t('downloadPdf')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
