'use client'

import { useState } from 'react'
import api from '@/lib/api'

export function useDownloadInvoice() {
  const [loading, setLoading] = useState(false)

  async function downloadInvoice(studentId: string, studentName: string, from: string, to: string) {
    setLoading(true)
    try {
      const response = await api.get('/payments/invoice', {
        params: { studentId, from, to },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `счёт-${studentName}-${from}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return { downloadInvoice, loading }
}
