import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Карточка с формой */}
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl border border-border p-8">
        {children}
      </div>
    </div>
  )
}
