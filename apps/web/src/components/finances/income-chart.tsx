'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { MonthlyIncome } from '@tutorflow/types'

interface IncomeChartProps {
  data: MonthlyIncome[]
  loading: boolean
}

function formatMonth(key: string): string {
  try {
    return format(new Date(`${key}-01`), 'LLL', { locale: ru })
  } catch {
    return key
  }
}

function formatTooltipValue(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}к ₽`
  return `${value} ₽`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const earned = payload.find((p) => p.dataKey === 'earned')?.value ?? 0
  const pending = payload.find((p) => p.dataKey === 'pending')?.value ?? 0

  return (
    <div className="surface-3 rounded-md p-3 text-xs shadow-elevation-3">
      <p className="mb-1.5 font-semibold capitalize text-foreground">{label}</p>
      {earned > 0 && (
        <p className="flex items-center gap-1.5 text-primary">
          <span className="h-2 w-2 rounded-[3px] bg-primary" />
          <span className="text-muted-foreground">Получено</span>
          <span className="tnum ml-auto font-semibold text-foreground">{formatTooltipValue(earned)}</span>
        </p>
      )}
      {pending > 0 && (
        <p className="mt-1 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-[3px] bg-warning/60" />
          <span className="text-muted-foreground">Ожидает</span>
          <span className="tnum ml-auto font-semibold text-foreground">{formatTooltipValue(pending)}</span>
        </p>
      )}
    </div>
  )
}

export function IncomeChart({ data, loading }: IncomeChartProps) {
  if (loading) return <Skeleton className="h-full min-h-[220px] rounded-xl" />

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }))

  const maxValue = Math.max(...data.map((d) => d.earned + d.pending), 1)
  // Округляем верх шкалы до «красивого» шага, чтобы столбцы заполняли область,
  // а не жались к низу (шкала по МАКСИМУМУ ЗА МЕСЯЦ, не по сумме).
  const niceStep = maxValue > 80000 ? 20000 : maxValue > 30000 ? 10000 : maxValue > 10000 ? 5000 : 1000
  const niceMax = Math.max(Math.ceil((maxValue * 1.1) / niceStep) * niceStep, niceStep)
  const hasData = data.some((d) => d.earned + d.pending > 0)

  return (
    <div className="surface-1 flex h-full flex-col rounded-xl p-4 shadow-elevation-1 lg:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Доходы за 6 месяцев
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-primary" />
            <span className="text-[11px] text-muted-foreground">Получено</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-warning/60" />
            <span className="text-[11px] text-muted-foreground">Ожидает</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-2">
            <BarChart3 size={24} strokeWidth={1.5} className="text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-foreground">Пока нет данных</p>
          <p className="max-w-[16rem] text-xs text-muted-foreground">
            Данные появятся после первых проведённых и оплаченных уроков
          </p>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%" minHeight={170}>
            <BarChart data={chartData} barSize={26} margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="2 4"
                stroke="hsl(var(--border))"
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                dy={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}к` : String(v))}
                domain={[0, niceMax]}
                ticks={[0, niceMax / 2, niceMax]}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))', radius: 6 }} />
              <Bar dataKey="earned" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="pending"
                stackId="a"
                fill="hsl(var(--warning))"
                opacity={0.6}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
