import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 pt-4 pb-2', className)}>
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 ml-3">{right}</div>}
    </div>
  )
}
