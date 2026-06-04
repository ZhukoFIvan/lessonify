import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-lg border border-[var(--border-subtle)] bg-surface-0 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground',
        'focus:outline-none focus:border-primary/60 focus:bg-surface-1 focus:ring-2 focus:ring-primary/25 focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-[background-color,border-color,box-shadow,color,opacity] duration-150',
        (type === 'date' || type === 'time') && 'max-w-full overflow-hidden appearance-none',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
