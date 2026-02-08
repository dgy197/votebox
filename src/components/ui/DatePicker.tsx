import { useState } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from './Calendar'
import { Popover } from './Popover'

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Válasszon dátumot',
  disabled = false,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          disabled={disabled}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg
            border border-obsidian-200 dark:border-obsidian-700 
            bg-white dark:bg-obsidian-800 
            text-left text-sm
            hover:border-obsidian-300 dark:hover:border-obsidian-600
            focus:ring-2 focus:ring-gold-400 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        >
          <CalendarIcon className="w-4 h-4 text-obsidian-400" />
          <span className={value ? 'text-obsidian-900 dark:text-ivory-100' : 'text-obsidian-400'}>
            {value 
              ? format(value, 'yyyy. MMMM d. (EEEE)', { locale: hu })
              : placeholder
            }
          </span>
        </button>
      }
    >
      <Calendar
        mode="single"
        selected={value}
        onSelect={handleSelect}
        disabled={[
          ...(minDate ? [{ before: minDate }] : []),
          ...(maxDate ? [{ after: maxDate }] : []),
        ]}
        initialFocus
      />
    </Popover>
  )
}
