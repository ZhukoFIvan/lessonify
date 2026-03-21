'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-full bg-secondary">
        <div className="w-9 h-9 rounded-full" />
      </div>
    )
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Светлая' },
    { value: 'system', icon: Monitor, label: 'Системная' },
    { value: 'dark', icon: Moon, label: 'Тёмная' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'p-2 rounded-full transition-all duration-200',
            theme === value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary-foreground/10',
          )}
          title={label}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  )
}
