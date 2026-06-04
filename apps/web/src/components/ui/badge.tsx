import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/12 text-primary ring-1 ring-inset ring-primary/20',
        success:
          'bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))] ring-1 ring-inset ring-[hsl(var(--success)/0.25)]',
        warning:
          'bg-[hsl(var(--warning)/0.16)] text-[hsl(var(--warning))] ring-1 ring-inset ring-[hsl(var(--warning)/0.28)]',
        danger:
          'bg-[hsl(var(--danger)/0.14)] text-[hsl(var(--danger))] ring-1 ring-inset ring-[hsl(var(--danger)/0.25)]',
        secondary: 'bg-surface-2 text-secondary-foreground ring-1 ring-inset ring-[var(--border-subtle)]',
        outline: 'border border-[var(--border-strong)] text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
