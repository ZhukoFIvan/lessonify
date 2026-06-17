'use client'

import { useState } from 'react'
import { format, setMonth, setYear } from 'date-fns'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useFormatters } from '@/i18n/use-formatters'
import { cn } from '@/lib/utils'

// Опорные даты первого числа каждого месяца — для локализованных названий
const MONTH_DATES = Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1))

interface MonthYearPickerProps {
  value: Date
  onChange: (date: Date) => void
  children: React.ReactNode
}

export function MonthYearPicker({ value, onChange, children }: MonthYearPickerProps) {
  const t = useTranslations('calendar')
  const f = useFormatters()
  const [open, setOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(value.getFullYear())

  function handleMonthSelect(monthIndex: number) {
    let newDate = setMonth(value, monthIndex)
    newDate = setYear(newDate, pickerYear)
    onChange(newDate)
    setOpen(false)
  }

  function handlePrevYear() {
    setPickerYear((y) => y - 1)
  }

  function handleNextYear() {
    setPickerYear((y) => y + 1)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={18} />
            {t('pickMonthYear')}
          </DialogTitle>
        </DialogHeader>

        {/* Year navigation */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handlePrevYear}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-xl font-bold min-w-[80px] text-center">{pickerYear}</span>
          <button
            onClick={handleNextYear}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Months grid */}
        <div className="grid grid-cols-3 gap-2">
          {MONTH_DATES.map((monthDate, index) => {
            const isSelected =
              value.getMonth() === index && value.getFullYear() === pickerYear
            return (
              <button
                key={index}
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-medium capitalize transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary text-foreground',
                )}
              >
                {format(monthDate, 'LLLL', { locale: f.dateFnsLocale })}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
