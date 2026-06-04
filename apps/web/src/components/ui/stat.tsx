import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Stat — крафтовый компонент для денежных/статистических чисел.
 *
 * Использование:
 *   // Простая статистическая карточка (для grid'ов на дашборде)
 *   <StatCard label="Доход за месяц" value="124 800" unit="₽" icon={<Wallet />} accent />
 *
 *   // Только число (hero-treatment) — встраивай куда угодно
 *   <StatNumber value="124 800" unit="₽" size="hero" />
 *
 * Числа всегда tabular-nums (выравниваются по колонкам), крупные и жирные.
 */

type StatSize = 'hero' | 'stat'

export interface StatNumberProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Готовая строка/число для показа (форматирование — на стороне вызывающего). */
  value: React.ReactNode
  /** Единица/суффикс (например "₽", "%") — рендерится приглушённо и мельче. */
  unit?: React.ReactNode
  /** Префикс перед числом (например "+", "−", "$"). */
  sign?: React.ReactNode
  /** hero — крупное hero-число; stat — компактнее для карточек в grid. */
  size?: StatSize
}

const StatNumber = React.forwardRef<HTMLDivElement, StatNumberProps>(
  ({ className, value, unit, sign, size = 'hero', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-baseline gap-1 text-foreground',
          size === 'hero' ? 'hero-number' : 'stat-number',
          className,
        )}
        {...props}
      >
        {sign != null && <span>{sign}</span>}
        <span>{value}</span>
        {unit != null && <span className="hero-unit">{unit}</span>}
      </div>
    )
  },
)
StatNumber.displayName = 'StatNumber'

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Подпись метрики (показывается приглушённо). */
  label: React.ReactNode
  /** Значение метрики (строка/число — отформатируй заранее). */
  value: React.ReactNode
  /** Суффикс/единица (например "₽"). */
  unit?: React.ReactNode
  /** Иконка слева в «таблетке». */
  icon?: React.ReactNode
  /** Дельта/тренд, например <Badge variant="success">+12%</Badge>. */
  trend?: React.ReactNode
  /** accent — добавляет лёгкий бренд-вош и индиго-обводку (для главной метрики). */
  accent?: boolean
  /** Размер числа. */
  size?: StatSize
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, unit, icon, trend, accent = false, size = 'stat', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col gap-3 rounded-lg border p-4 transition-all duration-200',
          accent
            ? 'brand-wash border-primary/25 shadow-elevation-1'
            : 'bg-card border-[var(--border-subtle)] shadow-elevation-1 hover:bg-surface-2 hover:shadow-elevation-2 hover:-translate-y-0.5',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-2">
          {icon != null && (
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
                accent ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted-foreground',
              )}
            >
              {icon}
            </span>
          )}
          {trend != null && <span className="ml-auto">{trend}</span>}
        </div>
        <div className="flex flex-col gap-0.5">
          <StatNumber value={value} unit={unit} size={size} />
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </div>
    )
  },
)
StatCard.displayName = 'StatCard'

// `Stat` alias for ergonomics / discoverability
const Stat = StatCard

export { Stat, StatCard, StatNumber }
