'use client'

import { useState } from 'react'
import { format, setMonth, setYear } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

interface MonthYearPickerProps {
  value: Date
  onChange: (date: Date) => void
  children: React.ReactNode
}

export function MonthYearPicker({ value, onChange, children }: MonthYearPickerProps) {
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
            Выбор месяца и года
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
          {MONTHS.map((month, index) => {
            const isSelected =
              value.getMonth() === index && value.getFullYear() === pickerYear
            return (
              <button
                key={month}
                onClick={() => handleMonthSelect(index)}
                className={cn(
                  'py-3 px-4 rounded-xl text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary text-foreground',
                )}
              >
                {month}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
