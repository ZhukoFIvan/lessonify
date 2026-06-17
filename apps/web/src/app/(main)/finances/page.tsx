'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { SummaryCard } from '@/components/finances/summary-card'
import { IncomeChart } from '@/components/finances/income-chart'
import { DebtorsList } from '@/components/finances/debtors-list'
import { InvoiceModal } from '@/components/finances/invoice-modal'
import { usePaymentSummary } from '@/hooks/use-payments'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeUp } from '@/lib/motion'

export default function FinancesPage() {
  const t = useTranslations('finances')
  const { summary, chart, loading } = usePaymentSummary(6)
  const [invoiceOpen, setInvoiceOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-col lg:p-8">
      {/* Заголовок */}
      <motion.div
        variants={fadeUp(0)}
        initial="hidden"
        animate="show"
        className="flex items-start justify-between px-4 pb-4 pt-5 lg:px-0 lg:pt-0"
      >
        <div>
          <h1 className="text-h2 font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground lg:text-sm">
            {t('subtitle')}
          </p>
        </div>
        <Button size="sm" variant="outline" className="mt-1 gap-1.5" onClick={() => setInvoiceOpen(true)}>
          <FileDown size={14} />
          {t('invoicePdf')}
        </Button>
      </motion.div>

      <div className="px-4 pb-8 lg:px-0">
        {/* Десктоп: герой-должники (широкая колонка) + сводка/график (сайдбар).
            Мобайл: компактная сводка → должники-герой → график. */}
        <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
          {/* Сводка дохода — на мобайле сверху, на десктопе в правом сайдбаре */}
          <motion.div variants={fadeUp(0.08)} initial="hidden" animate="show" className="order-1 lg:order-2 lg:col-span-4">
            <SummaryCard summary={summary} loading={loading} />
          </motion.div>

          {/* ГЕРОЙ: должники */}
          <motion.div variants={fadeUp(0.14)} initial="hidden" animate="show" className="order-2 lg:order-1 lg:col-span-8 lg:row-span-2">
            <DebtorsList />
          </motion.div>

          {/* График — на мобайле снизу, на десктопе под сводкой в сайдбаре */}
          <motion.div variants={fadeUp(0.2)} initial="hidden" animate="show" className="order-3 lg:order-3 lg:col-span-4 lg:min-h-[240px]">
            <IncomeChart data={chart} loading={loading} />
          </motion.div>
        </div>
      </div>

      <InvoiceModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} />
    </div>
  )
}
