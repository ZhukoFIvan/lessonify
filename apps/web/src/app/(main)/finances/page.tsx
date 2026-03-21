'use client'

import { useState } from 'react'
import { SummaryCard } from '@/components/finances/summary-card'
import { IncomeChart } from '@/components/finances/income-chart'
import { DebtorsList } from '@/components/finances/debtors-list'
import { InvoiceModal } from '@/components/finances/invoice-modal'
import { usePaymentSummary } from '@/hooks/use-payments'
import { AlertCircle, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FinancesPage() {
  const { summary, chart, loading } = usePaymentSummary(6)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-full lg:p-8">
      {/* ── Заголовок ── */}
      <div className="px-4 lg:px-0 pt-5 lg:pt-0 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Финансы</h1>
          <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">Доходы и задолженности</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 mt-1" onClick={() => setInvoiceOpen(true)}>
          <FileDown size={14} />
          Счёт PDF
        </Button>
      </div>

      <div className="px-4 lg:px-0 pb-6">
        {/* ── Top row: Summary + Chart ── */}
        <div className="grid gap-5 lg:grid-cols-2 mb-5">
          <SummaryCard summary={summary} loading={loading} />
          <IncomeChart data={chart} loading={loading} />
        </div>

        {/* ── Должники ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="text-warning" />
            <h2 className="text-base font-bold text-foreground">Должны заплатить</h2>
          </div>
          <DebtorsList />
        </div>
      </div>

      <InvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </div>
  )
}
