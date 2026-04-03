import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-2xl border border-input bg-secondary/50 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-secondary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-150',
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
