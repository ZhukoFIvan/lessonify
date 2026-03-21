'use client'

import { useToast } from './use-toast'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[390px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-2xl px-4 py-3 shadow-card-hover animate-slide-up',
            toast.variant === 'success' && 'bg-emerald-500 text-white',
            toast.variant === 'destructive' && 'bg-red-500 text-white',
            toast.variant === 'default' && 'bg-[#1A1A2E] text-white',
          )}
        >
          <div className="flex-1 min-w-0">
            {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
            {toast.description && (
              <p className="text-sm opacity-90 mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
