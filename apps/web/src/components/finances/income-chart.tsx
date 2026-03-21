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
    <div className="rounded-xl bg-card border border-border shadow-lg p-3 text-xs">
      <p className="font-semibold text-foreground mb-1.5 capitalize">{label}</p>
      {earned > 0 && (
        <p className="text-emerald-600">Получено: {formatTooltipValue(earned)}</p>
      )}
      {pending > 0 && (
        <p className="text-amber-600">Ожидает: {formatTooltipValue(pending)}</p>
      )}
    </div>
  )
}

export function IncomeChart({ data, loading }: IncomeChartProps) {
  if (loading) return <Skeleton className="h-48 rounded-2xl" />

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
  }))

  const maxValue = Math.max(...data.map((d) => d.earned + d.pending), 1)

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Доходы за 6 месяцев
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} barSize={12} barGap={2}>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}к` : String(v)}
            domain={[0, Math.ceil(maxValue * 1.15)]}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }} />
          <Bar dataKey="earned" stackId="a" fill="#6C63FF" radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending" stackId="a" fill="#F59E0B" opacity={0.6} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Легенда */}
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span className="text-xs text-muted-foreground">Получено</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-warning/60" />
          <span className="text-xs text-muted-foreground">Ожидает</span>
        </div>
      </div>
    </div>
  )
}
