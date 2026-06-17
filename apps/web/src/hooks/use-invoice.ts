'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import api from '@/lib/api'

export function useDownloadInvoice() {
  const t = useTranslations('toasts')
  const [loading, setLoading] = useState(false)

  async function downloadInvoice(studentId: string | undefined, studentName: string, from: string, to: string) {
    setLoading(true)
    try {
      const response = await api.get('/payments/invoice', {
        params: { ...(studentId ? { studentId } : {}), from, to },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${t('invoiceFilePrefix')}-${studentName}-${from}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return { downloadInvoice, loading }
}
